import { fetchApi, formatUpdated } from '../apiClient.js';
import { error, statRow, statRows } from './cardStates.js';
import { el } from './dom.js';

export async function renderValorant(cardEl) {
  const body = cardEl.querySelector('[data-slot="body"]');
  const updated = cardEl.querySelector('[data-slot="updated"]');
  const res = await fetchApi('/api/valorant/profile', 10 * 60_000);
  updated.textContent = formatUpdated(res.fetchedAt);

  if (!res.ok || !res.data) {
    return error(body, 'VALORANT profile unavailable', 'Manual profile is not configured.');
  }
  const d = res.data;
  // Manual config values — still rendered as text only, never HTML.
  const kd = typeof d.kdRatio === 'number' ? d.kdRatio.toFixed(2) : null;
  const wr = typeof d.winRate === 'number' ? `${d.winRate}%` : null;

  const rows = statRows();
  statRow(rows, 'Peak rank', d.peakRank, 'stat-row__val--rank');
  statRow(rows, 'Current rank', d.currentRank);
  statRow(rows, 'Main agent', d.mainAgent);
  statRow(rows, 'K/D ratio', kd);
  statRow(rows, 'Win rate', wr);

  const parts = [rows];
  if (d.lastVerified) {
    const verified = new Date(d.lastVerified);
    if (!isNaN(verified)) {
      parts.push(el('p', {
        className: 'roblox-desc',
        attrs: { style: 'font-size:0.78rem' },
        text: `Manually maintained · last verified ${verified.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      }));
    }
  }

  body.replaceChildren(...parts);
}
