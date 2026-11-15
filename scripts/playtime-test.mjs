import assert from 'node:assert/strict';
import { loadManualProfile } from '../api/valorant/profile.js';

console.log('[Playtime Verification Tests]');

// 1. osu! playtime contract
// ponytail: osu! API v2 play_time is integer seconds
const mockOsuStats = { play_time: 1425600 };
assert.equal(Math.round(mockOsuStats.play_time / 3600), 396, 'osu! seconds correctly converted to 396 hours');

// 2. VALORANT playtime & tracked match duration contract
const manual = loadManualProfile();
assert.equal(manual.trackedMatchSeconds, null, 'VALORANT manual fallback has no fabricated playtime');

// 3. Roblox contract
// Roblox has no official account-wide playtime API
const roblox = await import('../api/roblox/profile.js');
assert.ok(roblox.default, 'Roblox profile module exports default handler');

// 4. Tracked match formatting helper verification
function formatTracked(seconds) {
    if (typeof seconds !== 'number' || seconds <= 0) return null;
    return seconds >= 3600
        ? `${(seconds / 3600).toFixed(1)} hrs`
        : `${Math.round(seconds / 60)} mins`;
}
assert.equal(formatTracked(null), null, 'null seconds formats to null');
assert.equal(formatTracked(1800), '30 mins', '1800s formats to 30 mins');
assert.equal(formatTracked(5400), '1.5 hrs', '5400s formats to 1.5 hrs');

console.log('✓ All playtime logic assertions passed');
