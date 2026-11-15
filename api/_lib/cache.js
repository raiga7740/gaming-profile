/**
 * Minimal in-memory TTL cache.
 * Works on Vercel serverless functions (per-instance cache; warm invocations reuse it).
 */

const store = new Map();

/** @returns cached value or undefined */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs) {
  // Simple size guard to avoid unbounded growth.
  if (store.size > 200) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Returns cached value, or computes + stores it. */
export async function cached(key, ttlMs, fetcher) {
  const hit = cacheGet(key);
  if (hit !== undefined) {
    return { value: hit, cached: true };
  }
  const value = await fetcher();
  cacheSet(key, value, ttlMs);
  return { value, cached: false };
}

export const TTL = {
  OSU_PROFILE: 10 * 60 * 1000, // 10 minutes
  OSU_TOKEN: 55 * 60 * 1000, // just under osu!'s 1 hour token lifetime
  ROBLOX_PROFILE: 10 * 60 * 1000,
  DISCORD_PRESENCE: 45 * 1000, // 45 seconds — presence is live data
  VALORANT_PROFILE: 10 * 60 * 1000, // 10 minutes
};
