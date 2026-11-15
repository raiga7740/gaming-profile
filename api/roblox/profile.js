/**
 * Roblox profile service — official public Web API endpoints (no auth required).
 *  - users.roblox.com  : username -> id, user details
 *  - friends.roblox.com: friends count
 *  - thumbnails.roblox.com: avatar image
 */
import { cached, TTL } from '../_lib/cache.js';
import { ok, fail, guard, fetchJson } from '../_lib/http.js';

const USERNAME = 'Raiga7740';

async function getUserId(username) {
  const body = await fetchJson('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  const hit = body?.data?.[0];
  return hit && typeof hit.id === 'number'
    ? { id: hit.id, name: typeof hit.name === 'string' ? hit.name : '', displayName: typeof hit.displayName === 'string' ? hit.displayName : '' }
    : null;
}

async function getUserDetails(id) {
  const [user, friends, avatar] = await Promise.allSettled([
    fetchJson(`https://users.roblox.com/v1/users/${id}`),
    fetchJson(`https://friends.roblox.com/v1/users/${id}/friends/count`),
    fetchJson(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=420x420&format=Png&isCircular=false`
    ),
  ]);

  if (user.status !== 'fulfilled' || !user.value?.id) {
    const err = new Error('Roblox user details unavailable');
    err.status = user.status === 'rejected' ? user.reason?.status ?? 502 : 502;
    throw err;
  }

  // Diagnostics for optional sub-resources
  if (friends.status === 'rejected') {
    console.warn('[roblox] friends count fetch failed:', friends.reason?.message);
  }
  if (avatar.status === 'rejected') {
    console.warn('[roblox] avatar thumbnail fetch failed:', avatar.reason?.message);
  }

  const details = user.value;
  const friendsCount = friends.status === 'fulfilled' && typeof friends.value?.count === 'number'
    ? friends.value.count
    : null;

  let avatarUrl = null;
  if (avatar.status === 'fulfilled') {
    const t = avatar.value?.data?.[0];
    // Only pass through completed, HTTPS thumbnails from official CDN prefixes.
    if (
      t?.state === 'Completed' &&
      typeof t.imageUrl === 'string' &&
      (t.imageUrl.startsWith('https://tr.rbxcdn.com/') || t.imageUrl.startsWith('https://images.rbxcdn.com/'))
    ) {
      avatarUrl = t.imageUrl;
    }
  }

  // Cap the description so an oversized profile can't bloat responses.
  const description = typeof details.description === 'string' ? details.description.trim().slice(0, 1000) : null;

  return {
    userId: id,
    username: typeof details.name === 'string' ? details.name : USERNAME,
    displayName: typeof details.displayName === 'string' ? details.displayName : null,
    description,
    created: typeof details.created === 'string' ? details.created : null,
    isBanned: typeof details.isBanned === 'boolean' ? details.isBanned : false,
    friendsCount,
    avatarUrl,
    profileUrl: `https://www.roblox.com/users/${id}/profile`,
  };
}

async function handler(req, res) {
  const username = typeof req.query?.username === 'string' && req.query.username.trim() ? req.query.username.trim() : USERNAME;
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return fail(res, 400, 'invalid_username', 'Username must be 3–20 letters, digits or underscores.');
  }

  try {
    const { value, cached: isCached } = await cached(`roblox:${username}`, TTL.ROBLOX_PROFILE, async () => {
      const identified = await getUserId(username);
      if (!identified) return { unavailable: true, reason: 'username_not_found' };
      return await getUserDetails(identified.id);
    });

    if (value.unavailable) {
      return fail(res, 404, 'not_found', 'Roblox user not found.');
    }
    ok(res, value, { cached: isCached, cacheControl: 'public, s-maxage=300, stale-while-revalidate=600' });
  } catch (err) {
    const diag = err.status ? `status=${err.status} ${err.message}` : err.message;
    console.error('[roblox] upstream error:', diag);
    if (err.status === 429) {
      return fail(res, 429, 'rate_limited', 'Roblox API rate limit reached. Please try again later.');
    }
    if (err.status === 404) {
      return fail(res, 404, 'not_found', 'Roblox user not found.');
    }
    fail(res, 502, 'upstream_error', 'Roblox API is currently unavailable.');
  }
}

export default guard(handler);
