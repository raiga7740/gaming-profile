/**
 * Discord presence via Lanyard — https://github.com/phineas/lanyard
 * The Discord user must be opted in (join discord.gg/lanyard).
 * Never fakes status: if data is unavailable, the response says so.
 */
import { cached, TTL } from '../_lib/cache.js';
import { ok, fail, guard, fetchJson } from '../_lib/http.js';

const DISCORD_USER_ID = process.env.DISCORD_USER_ID || '';
const VALID_ID = /^\d{15,21}$/;
const AVATAR_HASH = /^(a_)?[a-f0-9]{32}$/;

function mapPresence(raw) {
  const user = raw?.discord_user ?? {};
  const activities = Array.isArray(raw?.activities) ? raw.activities : [];
  const game = activities.find((a) => a.type === 0) ?? null; // type 0 = PLAYING
  const customStatus = activities.find((a) => a.type === 4) ?? null;

  // Only build a CDN URL from a well-formed avatar hash and snowflake ID; anything else falls
  // back to the default Discord avatar.
  const avatarUrl =
    typeof user.avatar === 'string' &&
      AVATAR_HASH.test(user.avatar) &&
      typeof user.id === 'string' &&
      VALID_ID.test(user.id)
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
      : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return {
    userId: typeof user.id === 'string' ? user.id : null,
    username: typeof user.username === 'string' ? user.username : null,
    displayName: typeof user.global_name === 'string' ? user.global_name
      : typeof user.display_name === 'string' ? user.display_name : null,
    avatarUrl,
    status: raw?.discord_status ?? 'unknown', // online | idle | dnd | offline
    customStatus: typeof customStatus?.state === 'string' ? customStatus.state : null,
    activity: game && typeof game.name === 'string'
      ? {
        name: game.name,
        details: typeof game.details === 'string' ? game.details : null,
        state: typeof game.state === 'string' ? game.state : null,
      }
      : null,
  };
}

async function handler(req, res) {
  if (req.query?.userId !== undefined) {
    if (typeof req.query.userId !== 'string' || !VALID_ID.test(req.query.userId)) {
      return fail(res, 400, 'invalid_user_id', 'Discord user ID must be a numeric snowflake (15–21 digits).');
    }
  }

  const userId = typeof req.query?.userId === 'string' && VALID_ID.test(req.query.userId)
    ? req.query.userId
    : DISCORD_USER_ID;

  if (!userId || !VALID_ID.test(userId)) {
    return fail(res, 503, 'not_configured', 'Discord presence is not configured yet (missing DISCORD_USER_ID).');
  }

  try {
    const { value, cached: isCached } = await cached(`discord:${userId}`, TTL.DISCORD_PRESENCE, async () => {
      try {
        const body = await fetchJson(`https://api.lanyard.rest/v1/users/${userId}`);
        return body?.success ? body.data : { unavailable: true };
      } catch (err) {
        if (err.status === 404) return { unavailable: true, reason: 'not_monitored' };
        throw err;
      }
    });

    if (value?.unavailable) {
      // Explicitly not-online — the frontend renders a graceful fallback card.
      return ok(res, { monitored: false, status: 'unavailable' }, {
        cached: isCached,
        cacheControl: 'public, s-maxage=30, stale-while-revalidate=15',
      });
    }
    ok(res, { monitored: true, ...mapPresence(value) }, {
      cached: isCached,
      cacheControl: 'public, s-maxage=30, stale-while-revalidate=15',
    });
  } catch (err) {
    const diag = err.status ? `status=${err.status} ${err.message}` : err.message;
    console.error('[discord] upstream error:', diag);
    if (err.status === 429) {
      return fail(res, 429, 'rate_limited', 'Lanyard API rate limit reached. Please try again later.');
    }
    fail(res, 502, 'upstream_error', 'Lanyard API is currently unavailable.');
  }
}

export default guard(handler);
