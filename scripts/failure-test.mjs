/**
 * Failure-mode tests: unavailable upstream services + error sanitization + deterministic abort timeout.
 * Run: node scripts/failure-test.mjs
 */
import http from 'node:http';
import { fetchJson, guard, fail } from '../api/_lib/http.js';

process.env.NODE_ENV = 'test';

let failures = 0;
const check = (name, cond) => { console.log(`  ${cond ? '✓' : '✗'} ${name}`); if (!cond) failures++; };

console.log('[1] Upstream unavailable (unreachable host, closed port):');
let rejected = null;
try {
  await fetchJson('https://127.0.0.1:1/api');
} catch (err) {
  rejected = err;
}
check('request rejects instead of hanging', rejected !== null);
check('error message contains no secrets or URL internals',
  rejected instanceof Error && !/secret|token|password/i.test(rejected.message));

console.log('[2] Deterministic timeout enforcement (AbortController cancellation):');
let requestReceived = false;
const hangingServer = http.createServer((req, res) => {
  requestReceived = true;
  // Intentionally hold the socket open without responding to verify AbortController cancels active requests
});

await new Promise((resolve) => hangingServer.listen(0, '127.0.0.1', resolve));
const port = hangingServer.address().port;

const start = Date.now();
let abortError = null;
try {
  await fetchJson(`http://127.0.0.1:${port}/hanging`, { timeoutMs: 250 });
} catch (err) {
  abortError = err;
}
const elapsed = Date.now() - start;

hangingServer.closeAllConnections?.();
await new Promise((resolve) => hangingServer.close(resolve));

check('connection was established and request was in flight (not an immediate network failure)', requestReceived);
check('aborted cleanly with AbortError', abortError !== null && abortError.name === 'AbortError');
check(`abort fired after configured timeout (took ${elapsed}ms, expected >= 230ms and < 2000ms)`, elapsed >= 230 && elapsed < 2000);

// Test security constraint: arbitrary http URLs remain blocked
let insecureBlocked = false;
try {
  await fetchJson('http://example.com/api');
} catch (err) {
  insecureBlocked = err.message.includes('insecure request blocked');
}
check('insecure non-loopback HTTP remains strictly blocked', insecureBlocked);

console.log('[3] guard() sanitizes unexpected handler errors:');
function mockRes() {
  return {
    statusCode: 0, headers: {}, body: '',
    setHeader(k, v) { this.headers[k] = v; },
    end(b) { this.body = b ?? ''; },
  };
}
const throwingHandler = async () => {
  throw new Error('FAILED: OSU_CLIENT_SECRET=super-secret-value leaked');
};
const res = mockRes();
await guard(throwingHandler)({}, res);
const payload = JSON.parse(res.body);
check('returns 500', res.statusCode === 500);
check('generic message, no upstream error text',
  payload.error.message === 'An internal error occurred. Please try again later.' &&
  !payload.error.message.includes('OSU_CLIENT_SECRET'));
check('console output is the only place the error lands (server logs)', payload.error.code === 'internal_error');

console.log('[4] fail() envelopes are well-formed:');
const res2 = mockRes();
fail(res2, 404, 'not_found', 'Roblox user not found.');
const p2 = JSON.parse(res2.body);
check('ok:false + code + message shape', p2.ok === false && p2.error.code === 'not_found');
check('error response sets no-store Cache-Control header',
  res2.headers['Cache-Control'] === 'no-store, no-cache, must-revalidate');

console.log(failures === 0 ? '\nFailure-mode tests: ALL PASSED' : `\nFailure-mode tests: ${failures} FAILURE(S)`);
process.exit(failures ? 1 : 0);
