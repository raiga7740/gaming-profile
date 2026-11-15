import { fetchApi, formatUpdated } from '../apiClient.js';
import { error, statRow, statRows } from './cardStates.js';
import { el, setImgSrc } from './dom.js';

function rankRow(container, key, rankText, iconUrl) {
  const row = el('div', { className: 'stat-row' });
  row.append(el('span', { className: 'stat-row__key', text: key }));

  if (!rankText) {
    row.append(el('span', { className: 'stat-row__val stat-row__val--unavailable', text: 'n/a' }));
    container.append(row);
    return;
  }

  const val = el('span', {
    className: 'stat-row__val stat-row__val--rank',
    attrs: { style: 'display:inline-flex; align-items:center; gap:6px;' },
  });
  if (iconUrl) {
    const img = el('img', { attrs: { alt: '', width: '20', height: '20', loading: 'lazy' } });
    setImgSrc(img, iconUrl);
    val.append(img);
  }
  val.append(document.createTextNode(rankText));
  row.append(val);
  container.append(row);
}

export async function renderValorant(cardEl) {
  const body = cardEl.querySelector('[data-slot="body"]');
  const updated = cardEl.querySelector('[data-slot="updated"]');
  const res = await fetchApi('/api/valorant/profile', 10 * 60_000);
  updated.textContent = formatUpdated(res.fetchedAt);

  if (!res.ok || !res.data) {
    return error(body, 'VALORANT profile unavailable', res.error ?? 'Profile is not configured.');
  }

  const d = res.data;
  const badge = cardEl.querySelector('.badge');
  const footnote = cardEl.querySelector('.game-card__footnote');
  const handle = cardEl.querySelector('.game-card__handle');

  if (d.riotId && d.tagline && handle) {
    handle.textContent = `${d.riotId}#${d.tagline}`;
  }

  if (res.source === 'api') {
    if (badge) {
      badge.className = 'badge badge--api';
      badge.textContent = 'Live API';
    }
    if (footnote) {
      footnote.textContent = 'Live stats via HenrikDev VALORANT API.';
    }
  } else {
    if (badge) {
      badge.className = 'badge badge--manual';
      badge.textContent = 'Manual data';
    }
    if (footnote) {
      footnote.textContent =
        'Riot personal stats require authorized API access — values are maintained by hand.';
    }
  }

  const kd = typeof d.kdRatio === 'number' ? d.kdRatio.toFixed(2) : null;
  const wr = typeof d.winRate === 'number' ? `${d.winRate}%` : null;
  const rr = typeof d.currentRR === 'number' ? `${d.currentRR} RR` : null;

  const rows = statRows();
  statRow(rows, 'Peak rank', d.peakRank, 'stat-row__val--rank');
  rankRow(rows, 'Current rank', d.currentRank, d.rankIcon);
  if (rr) statRow(rows, 'Current RR', rr);
  statRow(rows, 'Main agent', d.mainAgent);
  statRow(rows, 'K/D ratio', kd);
  statRow(rows, 'Win rate', wr);

  const parts = [rows];

  if (Array.isArray(d.recentMatches) && d.recentMatches.length > 0) {
    const matchSection = el('div', { attrs: { style: 'margin-top:14px;' } });
    matchSection.append(
      el(
        'div',
        {
          className: 'stat-row',
          attrs: {
            style:
              'border-bottom:1px solid rgba(48,48,54,0.55); padding-bottom:6px; margin-bottom:4px;',
          },
        },
        [
          el('span', {
            className: 'stat-row__key',
            attrs: {
              style:
                'font-weight:600; text-transform:uppercase; font-size:0.75rem; letter-spacing:0.04em;',
            },
            text: 'Recent matches',
          }),
        ]
      )
    );

    for (const m of d.recentMatches) {
      const isWin = m.result === 'win';
      const resultColor = isWin ? 'var(--accent)' : 'var(--muted)';
      matchSection.append(
        el(
          'div',
          {
            className: 'stat-row',
            attrs: { style: 'padding:4px 0; font-size:0.82rem;' },
          },
          [
            el('span', { className: 'stat-row__key', text: `${m.map} · ${m.agent}` }),
            el('span', {
              className: 'stat-row__val',
              attrs: { style: `font-size:0.82rem; color:${resultColor};` },
              text: `${m.score} (${m.kills}/${m.deaths}/${m.assists})`,
            }),
          ]
        )
      );
    }
    parts.push(matchSection);
  }

  if (d.lastVerified && res.source === 'manual') {
    const verified = new Date(d.lastVerified);
    if (!isNaN(verified)) {
      parts.push(
        el('p', {
          className: 'roblox-desc',
          attrs: { style: 'font-size:0.78rem; margin-top:12px;' },
          text: `Manually maintained · last verified ${verified.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}`,
        })
      );
    }
  }

  body.replaceChildren(...parts);
}
