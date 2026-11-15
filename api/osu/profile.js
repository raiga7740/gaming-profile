/**
 * osu! API v2 service — OAuth2 Client Credentials flow, public scope.
 * Docs: https://osu.ppy.sh/docs/index.html
 * Secrets live only in env vars and are never logged or returned.
 */

import { cached, cacheSet, cacheGet, TTL } from '../_lib/cache.js';
import { ok, fail, guard, fetchJson, requireEnv } from '../_lib/http.js';

const USERNAME = 'Raiga7740';
const TOKEN_KEY = 'osu:access_token';
const VALID_OSU_USERNAME = /^[A-Za-z0-9_\-[\] ]{2,32}$/;

/** Get (and cache) a client-credentials access token. Never logged or returned. */
async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh) {
    const hit = cacheGet(TOKEN_KEY);
    if (hit) return hit;
  }

  const clientId = process.env.OSU_CLIENT_ID;
  const clientSecret = process.env.OSU_CLIENT_SECRET;

  const body = await fetchJson('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'public',
    }),
  });

  if (!body?.access_token) {
    throw new Error('token response missing access_token');
  }
  // Cache slightly shorter than the actual expiry to be safe.
  const expiresInMs = Math.max(60_000, (body.expires_in ?? 86400) * 1000 - 120_000);
  cacheSet(TOKEN_KEY, body.access_token, Math.min(expiresInMs, TTL.OSU_TOKEN));
  return body.access_token;
}

async function fetchProfile(username) {
  const token = await getAccessToken();
  // osu! API v2: GET /api/v2/users/{user}/{mode} — lookup by username string works for the default mode.
  return fetchJson(`https://osu.ppy.sh/api/v2/users/${encodeURIComponent(username)}/osu`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
}

async function handler(req, res) {
  const username =
    typeof req.query?.username === 'string' && req.query.username.trim()
      ? req.query.username.trim()
      : USERNAME;

  if (!VALID_OSU_USERNAME.test(username)) {
    return fail(res, 400, 'invalid_username', 'Username must be 2–32 valid characters.');
  }

  if (!requireEnv(res, ['OSU_CLIENT_ID', 'OSU_CLIENT_SECRET'])) return;

  try {
    const { value, cached: isCached } = await cached(`osu:${username}`, TTL.OSU_PROFILE, async () => {
      try {
        return await fetchProfile(username);
      } catch (err) {
        // A 401 likely means our cached token expired upstream — refresh once and retry.
        if (err.status === 401) {
          const fresh = await getAccessToken(true);
          return fetchJson(`https://osu.ppy.sh/api/v2/users/${encodeURIComponent(username)}/osu`, {
            headers: { Authorization: `Bearer ${fresh}`, Accept: 'application/json' },
          });
        }
        throw err;
      }
    });

    if (!value?.id) {
      return fail(res, 404, 'not_found', 'osu! user not found.');
    }

    const avatarUrl = typeof value.avatar_url === 'string' && value.avatar_url.startsWith('https://')
      ? value.avatar_url
      : null;

    ok(
      res,
      {
        username: value.username,
        avatarUrl,
        countryCode: value.country?.code ?? null,
        countryName: value.country?.name ?? null,
        globalRank: value.statistics?.global_rank ?? null,
        countryRank: value.statistics?.country_rank ?? null,
        pp: value.statistics?.pp ?? null,
        accuracy: value.statistics?.hit_accuracy ?? null,
        playCount: value.statistics?.play_count ?? null,
        // ponytail: raw seconds from official osu! API; frontend formats to hours
        playTimeSeconds: typeof value.statistics?.play_time === 'number' ? value.statistics.play_time : null,
        level: value.statistics?.level?.current ?? null,
        rankedScore: value.statistics?.ranked_score ?? null,
        maxCombo: value.statistics?.maximum_combo ?? null,
        joinDate: value.join_date ?? null,
      },
      { cached: isCached, cacheControl: 'public, s-maxage=300, stale-while-revalidate=600' }
    );
  } catch (err) {
    const diag = err.status ? `status=${err.status} ${err.message}` : err.message;
    console.error('[osu] upstream error:', diag);
    if (err.status === 404) return fail(res, 404, 'not_found', 'osu! user not found.');
    if (err.status === 429) return fail(res, 429, 'rate_limited', 'osu! API rate limit reached. Please try again later.');
    if (err.status === 401) return fail(res, 502, 'auth_error', 'osu! authentication failed. Check credentials.');
    fail(res, 502, 'upstream_error', 'osu! API is currently unavailable.');
  }
}

export default guard(handler);
