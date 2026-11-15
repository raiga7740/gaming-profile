/**
 * Frontend API client — shared by every card component.
 * Each card gets: loading / success / empty / error states + last-updated timestamp.
 */

const cache = new Map(); // url -> { payload, expiresAt }

function getCached(url, ttlMs) {
  const hit = cache.get(url);
  if (hit && Date.now() < hit.expiresAt) return hit.payload;
  return null;
}

function setCached(url, payload, ttlMs) {
  cache.set(url, { payload, expiresAt: Date.now() + ttlMs });
}

/**
 * @param {string} url API endpoint
 * @param {number} ttlMs client-side cache TTL
 * @returns {Promise<{ok:boolean, data:any, source:string, error?:string, fetchedAt?:string}>}
 */
export async function fetchApi(url, ttlMs = 60_000) {
  const hit = getCached(url, ttlMs);
  if (hit) return hit;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await res.json().catch(() => null);

    if (!body || typeof body.ok !== 'boolean') {
      return { ok: false, data: null, source: 'api', error: 'Malformed API response.' };
    }

    const result = body.ok
      ? { ok: true, data: body.data, source: body.source ?? 'api', fetchedAt: body.fetchedAt }
      : { ok: false, data: null, source: 'api', error: body.error?.message ?? 'Request failed.' };

    // Cache failures briefly so a broken integration doesn't hammer the backend.
    setCached(url, result, result.ok ? ttlMs : 15_000);
    return result;
  } catch {
    return { ok: false, data: null, source: 'api', error: 'Network error — could not reach the API.' };
  }
}

/** Format an ISO timestamp as "Updated HH:MM" local time. */
export function formatUpdated(iso) {
  if (!iso) return '—';
  const t = new Date(iso);
  return isNaN(t) ? '—' : `Updated ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export const fmt = {
  num: (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : null),
  pct: (n) => (typeof n === 'number' ? `${n.toFixed(2)}%` : null),
};
