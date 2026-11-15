/**
 * Shared helpers for API routes: JSON responses, error handling, safe fetch.
 * Never logs or returns secrets / tokens.
 */

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function ok(res, payload, meta = {}) {
  if (meta.cacheControl) {
    res.setHeader('Cache-Control', meta.cacheControl);
  }
  json(res, 200, {
    ok: true,
    data: payload,
    source: meta.source ?? 'api', // 'api' | 'manual' — distinguishes live data from configured data
    cached: meta.cached ?? false,
    fetchedAt: new Date().toISOString(),
  });
}

export function fail(res, status, code, message) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  json(res, status, { ok: false, error: { code, message } });
}

/** wrap handler so unexpected errors never leak internals */
export function guard(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      const sanitizedMsg = (err.message || '').replace(/(key|token|secret|password)=[^&\s]+/gi, '$1=[REDACTED]');
      console.error('[api] unhandled error:', sanitizedMsg);
      fail(res, 500, 'internal_error', 'An internal error occurred. Please try again later.');
    }
  };
}

const TIMEOUT_MS = 12000;

/** fetch with timeout + HTTPS enforcement */
export async function fetchJson(url, options = {}) {
  // Allow loopback HTTP exclusively under test mode for deterministic abort verification
  const isLoopbackTest = process.env.NODE_ENV === 'test' && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url);
  if (!url.startsWith('https://') && !isLoopbackTest) {
    throw new Error('insecure request blocked');
  }

  // ponytail: timeout capped at 12s; upgrade to per-route configurable timeouts if streaming endpoints are added.
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`upstream responded ${res.status}`);
      err.status = res.status;
      err.upstream = body;
      throw err;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export function requireEnv(res, names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) {
    fail(res, 503, 'not_configured', `This integration is not configured yet (missing: ${missing.join(', ')}).`);
    return false;
  }
  return true;
}
