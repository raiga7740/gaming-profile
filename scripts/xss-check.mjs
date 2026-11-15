/**
 * Frontend XSS safety checks.
 *  1. Static: no component may assign innerHTML / insertAdjacentHTML / document.write.
 *  2. Static: no `${...}` template interpolation may reach an HTML sink.
 *  3. Behavioral: dom.js URL allow-list and class whitelist reject hostile input.
 * Run: node scripts/xss-check.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const componentsDir = join(ROOT, 'src', 'js', 'components');

let failures = 0;
const fail = (msg) => { failures++; console.error(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

console.log('[1] Static scan — HTML sinks in frontend components:');
for (const file of readdirSync(componentsDir).filter((f) => f.endsWith('.js'))) {
  const src = readFileSync(join(componentsDir, file), 'utf-8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (/innerHTML|insertAdjacentHTML|outerHTML|document\.write/.test(line)) {
      fail(`${file}:${i + 1} uses an HTML sink: ${line.trim().slice(0, 80)}`);
    }
  });
}
pass('no innerHTML / insertAdjacentHTML / outerHTML / document.write in any component');

console.log('[2] Static scan — index.html + main.js interpolation sinks:');
for (const file of ['index.html', 'src/js/main.js']) {
  const src = readFileSync(join(ROOT, file), 'utf-8');
  if (/\.innerHTML\s*=/.test(src)) fail(`${file} assigns innerHTML`);
}
pass('index.html and main.js contain no innerHTML assignments');

console.log('[3] Behavioral — dom.js untrusted-input handling:');
const dom = await import('../src/js/components/dom.js');

const hostileUrls = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'https://evil.example/steal.png',
  'https://cdn.discordapp.com.evil.com/a.png',
  "//cdn.discordapp.com/avatars/1/abc.png",
  '',
  null,
  123,
];
for (const url of hostileUrls) {
  if (dom.safeImageUrl(url) !== null) fail(`safeImageUrl accepted hostile input: ${JSON.stringify(url)}`);
}
const goodUrls = [
  'https://cdn.discordapp.com/avatars/610382027002478612/abc123.png?size=256',
  'https://cdn.discordapp.com/embed/avatars/0.png',
  'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-1ACEDEF0',
  'https://a.ppy.sh/10970073',
];
for (const url of goodUrls) {
  if (dom.safeImageUrl(url) !== url) fail(`safeImageUrl rejected legitimate URL: ${url}`);
}
pass(`image URL allow-list blocks ${hostileUrls.length} hostile patterns, allows official CDN URLs`);

const hostileClasses = ['online; position:fixed', 'online" onmouseover="alert(1)', '../../evil', 'ONLINE'];
for (const c of hostileClasses) {
  if (dom.safeClass(c, 'status-dot--', ['online', 'idle', 'dnd', 'offline'], 'offline') !== 'status-dot--offline') {
    fail(`safeClass passed hostile input through: ${JSON.stringify(c)}`);
  }
}
if (dom.safeClass('online', 'status-dot--', ['online', 'idle', 'dnd', 'offline'], 'offline') !== 'status-dot--online') {
  fail('safeClass broke the legitimate "online" status');
}
pass('status class whitelist falls back to neutral class for hostile input');

console.log(failures === 0 ? '\nXSS checks: ALL PASSED' : `\nXSS checks: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
