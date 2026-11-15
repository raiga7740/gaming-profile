/**
 * VALORANT profile service — HenrikDev VALORANT API integration with manual fallback.
 * Docs: https://docs.henrikdev.xyz/
 * Secrets live only in env vars and are never logged or returned.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cached, TTL } from '../_lib/cache.js';
import { ok, fail, guard, fetchJson } from '../_lib/http.js';

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'valorant.json');
const DEFAULT_NAME = 'haerin';
const DEFAULT_TAG = '10927';
const VALID_NAME = /^[A-Za-z0-9 _.-]{1,16}$/;
const VALID_TAG = /^[A-Za-z0-9]{3,5}$/;

export function loadManualProfile() {
  try {
    const raw = readFileSync(DATA_PATH, 'utf-8');
    const profile = JSON.parse(raw);
    return {
      riotId: profile.riotId,
      tagline: profile.tagline,
      peakRank: profile.peakRank ?? null,
      currentRank: profile.currentRank ?? null,
      currentRR: profile.currentRR ?? null,
      rankIcon: profile.rankIcon ?? null,
      mainAgent: profile.mainAgent ?? null,
      kdRatio: profile.kdRatio ?? null,
      winRate: profile.winRate ?? null,
      recentMatches: profile.recentMatches ?? [],
      lastVerified: profile.lastVerified ?? null,
      note: profile.note ?? null,
      source: 'manual',
    };
  } catch {
    return null;
  }
}

function parseRiotId(req) {
  let name = DEFAULT_NAME;
  let tag = DEFAULT_TAG;

  if (typeof req.query?.riotId === 'string' && req.query.riotId.includes('#')) {
    const parts = req.query.riotId.trim().split('#');
    name = parts[0];
    tag = parts[1];
  } else {
    if (typeof req.query?.name === 'string' && req.query.name.trim()) {
      name = req.query.name.trim();
    }
    if (typeof req.query?.tag === 'string' && req.query.tag.trim()) {
      tag = req.query.tag.trim();
    }
  }

  return { name, tag };
}

function aggregateMatchStats(matches, puuid, name, tag) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return { kdRatio: null, winRate: null, mainAgent: null, recentMatches: [] };
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let wins = 0;
  let countedMatches = 0;
  const agentCounts = {};
  const recentMatches = [];

  for (const match of matches) {
    const players = match?.players?.all_players;
    if (!Array.isArray(players)) continue;

    const player = players.find(
      (p) =>
        p.puuid === puuid ||
        (p.name?.toLowerCase() === name.toLowerCase() && p.tag?.toLowerCase() === tag.toLowerCase())
    );
    if (!player) continue;

    countedMatches++;
    const kills = player.stats?.kills ?? 0;
    const deaths = player.stats?.deaths ?? 0;
    const assists = player.stats?.assists ?? 0;
    totalKills += kills;
    totalDeaths += deaths;

    const agent = player.character ?? 'Unknown';
    agentCounts[agent] = (agentCounts[agent] ?? 0) + 1;

    const team = (player.team ?? '').toLowerCase();
    const teamData = match.teams?.[team];
    const won = teamData?.has_won === true;
    if (won) wins++;

    const roundsWon = teamData?.rounds_won ?? 0;
    const roundsLost = teamData?.rounds_lost ?? 0;

    recentMatches.push({
      map: match.metadata?.map ?? 'Unknown',
      agent,
      result: won ? 'win' : roundsWon === roundsLost ? 'draw' : 'loss',
      score: `${roundsWon}-${roundsLost}`,
      kills,
      deaths,
      assists,
      date: match.metadata?.game_start_patched ?? null,
    });
  }

  let mainAgent = null;
  let maxCount = 0;
  for (const [agent, count] of Object.entries(agentCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mainAgent = agent;
    }
  }

  const kdRatio =
    countedMatches > 0
      ? totalDeaths > 0
        ? Number((totalKills / totalDeaths).toFixed(2))
        : totalKills
      : null;
  const winRate = countedMatches > 0 ? Math.round((wins / countedMatches) * 100) : null;

  return { kdRatio, winRate, mainAgent, recentMatches: recentMatches.slice(0, 5) };
}

async function fetchHenrikData(name, tag, apiKey) {
  const headers = { Authorization: apiKey, Accept: 'application/json' };

  // 1. Account info (provides puuid and region/affinity)
  const accountRes = await fetchJson(
    `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
    { headers }
  );

  const account = accountRes?.data;
  if (!account?.puuid) {
    const err = new Error('Player account not found');
    err.status = 404;
    throw err;
  }

  const puuid = account.puuid;
  const region = account.region || 'ap';

  // 2. MMR / Ranked stats
  let mmrData = null;
  try {
    const mmrRes = await fetchJson(
      `https://api.henrikdev.xyz/valorant/v2/by-puuid/mmr/${encodeURIComponent(region)}/${encodeURIComponent(puuid)}`,
      { headers }
    );
    mmrData = mmrRes?.data ?? null;
  } catch (err) {
    // If by-puuid mmr lookup fails, attempt lookup by name/tag
    try {
      const mmrRes = await fetchJson(
        `https://api.henrikdev.xyz/valorant/v2/mmr/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        { headers }
      );
      mmrData = mmrRes?.data ?? null;
    } catch {
      // Allow profile to proceed without MMR if competitive data is unavailable
    }
  }

  // 3. Match history for K/D, Win Rate, Agent stats
  let matches = [];
  try {
    const matchRes = await fetchJson(
      `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${encodeURIComponent(region)}/${encodeURIComponent(puuid)}?mode=competitive&size=5`,
      { headers }
    );
    matches = Array.isArray(matchRes?.data) ? matchRes.data : [];
  } catch {
    try {
      const fallbackRes = await fetchJson(
        `https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${encodeURIComponent(region)}/${encodeURIComponent(puuid)}?size=5`,
        { headers }
      );
      matches = Array.isArray(fallbackRes?.data) ? fallbackRes.data : [];
    } catch {
      // Match history unavailable; proceed with account/MMR
    }
  }

  const currentRank = mmrData?.current_data?.currenttierpatched ?? null;
  const currentRR =
    typeof mmrData?.current_data?.ranking_in_tier === 'number'
      ? mmrData.current_data.ranking_in_tier
      : null;
  const rankIcon =
    mmrData?.current_data?.images?.small ?? mmrData?.current_data?.images?.large ?? null;
  const peakRank = mmrData?.highest_rank?.patched_tier ?? null;
  const peakSeason = mmrData?.highest_rank?.season ?? null;

  const matchStats = aggregateMatchStats(matches, puuid, name, tag);

  return {
    riotId: account.name ?? name,
    tagline: account.tag ?? tag,
    region,
    accountLevel: account.account_level ?? null,
    cardSmall: account.card?.small ?? null,
    currentRank: currentRank ?? 'Unrated',
    currentRR,
    rankIcon,
    peakRank,
    peakSeason,
    mainAgent: matchStats.mainAgent,
    kdRatio: matchStats.kdRatio,
    winRate: matchStats.winRate,
    recentMatches: matchStats.recentMatches,
  };
}

async function handler(req, res) {
  const { name, tag } = parseRiotId(req);

  if (!VALID_NAME.test(name) || !VALID_TAG.test(tag)) {
    return fail(res, 400, 'invalid_riot_id', 'Riot ID must be in the format name#tag (e.g. haerin#10927).');
  }

  const apiKey =
    process.env.HENRIK_API_KEY ||
    process.env.VALORANT_API_KEY ||
    process.env.HENRIKDEV_API_KEY;

  const isStrict = req.query?.strict === 'true';

  if (!apiKey) {
    if (isStrict) {
      return fail(res, 503, 'not_configured', 'HenrikDev VALORANT API is not configured yet (missing HENRIK_API_KEY).');
    }
    const manual = loadManualProfile();
    return ok(res, manual, {
      source: 'manual',
      cacheControl: 'public, s-maxage=3600, stale-while-revalidate=86400',
    });
  }

  try {
    const cacheKey = `valorant:${name.toLowerCase()}:${tag.toLowerCase()}`;
    const { value, cached: isCached } = await cached(cacheKey, TTL.VALORANT_PROFILE, async () => {
      return fetchHenrikData(name, tag, apiKey);
    });

    ok(res, value, {
      cached: isCached,
      source: 'api',
      cacheControl: 'public, s-maxage=300, stale-while-revalidate=600',
    });
  } catch (err) {
    console.error('[valorant] upstream error:', err.status ? `status=${err.status} ${err.message}` : err.message);

    if (err.status === 404) {
      return fail(res, 404, 'not_found', 'VALORANT player not found.');
    }

    if (isStrict) {
      if (err.status === 429) {
        return fail(res, 429, 'rate_limited', 'VALORANT API rate limit reached. Please try again later.');
      }
      if (err.status === 401) {
        return fail(res, 502, 'auth_error', 'VALORANT API authentication failed. Check credentials.');
      }
      return fail(res, 502, 'upstream_error', 'VALORANT API is currently unavailable.');
    }

    // Graceful fallback to manual data so site never breaks on upstream outage
    const manual = loadManualProfile();
    ok(res, manual, {
      source: 'manual',
      cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
    });
  }
}

export default guard(handler);
