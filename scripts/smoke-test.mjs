/**
 * Local smoke test for the API route handlers (no Vercel needed).
 * Usage: node scripts/smoke-test.mjs [osu]
 */
function mockRes(label) {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(k, v) { this.headers[k] = v; },
    end(b) { this.body = b ?? ''; },
  };
}

async function call(label, mod, req) {
  const res = mockRes();
  await mod.default(req, res);
  let parsed;
  try { parsed = JSON.parse(res.body); } catch { parsed = res.body.slice(0, 120); }
  const dataStr = parsed?.data ? JSON.stringify(parsed.data).slice(0, 220) : '';
  console.log(`\n[${label}] status=${res.statusCode}`);
  console.log(`  ok=${parsed?.ok} code=${parsed?.error?.code ?? '-'} source=${parsed?.source ?? '-'} cached=${parsed?.cached ?? '-'}`);
  if (parsed?.error) console.log(`  error: ${parsed.error.message}`);
  if (dataStr) console.log(`  data: ${dataStr}`);
}

const roblox = await import('../api/roblox/profile.js');
const valorant = await import('../api/valorant/profile.js');
const discord = await import('../api/discord/presence.js');
const osu = await import('../api/osu/profile.js');

await call('roblox Raiga7740', roblox, { query: {} });
await call('roblox invalid username', roblox, { query: { username: 'x!' } });
await call('roblox unknown username', roblox, { query: { username: 'zzz_no_such_user_qq' } });
await call('valorant manual', valorant, { query: {} });
await call('discord presence (unconfigured/fallback)', discord, { query: {} });
await call('discord invalid userId', discord, { query: { userId: 'invalid!' } });
await call('osu missing creds', osu, { query: {} });
await call('osu invalid username', osu, { query: { username: '!' } });
