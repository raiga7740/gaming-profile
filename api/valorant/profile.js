/**
 * VALORANT profile — MANUAL data only for now.
 *
 * Riot's ordinary developer API keys cannot retrieve personal ranked/agent stats
 * (RSO + approval required). We do not scrape unofficial trackers.
 * This route serves clearly-labeled manual config from src/data/valorant.json,
 * behind a service interface ready for a future authorized integration.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ok, guard } from '../_lib/http.js';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'valorant.json');

function loadManualProfile() {
  const raw = readFileSync(DATA_PATH, 'utf-8');
  const profile = JSON.parse(raw);
  return {
    riotId: profile.riotId,
    tagline: profile.tagline,
    peakRank: profile.peakRank ?? null,
    currentRank: profile.currentRank ?? null,
    mainAgent: profile.mainAgent ?? null,
    kdRatio: profile.kdRatio ?? null,
    winRate: profile.winRate ?? null,
    lastVerified: profile.lastVerified ?? null,
    note: profile.note ?? null,
    source: 'manual',
  };
}

async function handler(_req, res) {
  try {
    const profile = loadManualProfile();
    // `source: 'manual'` — the frontend renders a "Manually maintained" badge for this card.
    ok(res, profile, { source: 'manual', cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400' });
  } catch (err) {
    console.error('[valorant] config error:', err.message);
    ok(res, null, { source: 'manual', cacheControl: 'public, s-maxage=60, stale-while-revalidate=300' });
  }
}

export default guard(handler);
