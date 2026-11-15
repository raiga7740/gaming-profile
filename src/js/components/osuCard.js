import { fetchApi, fmt } from '../apiClient.js';

export async function renderOsu(cardEl) {
  if (!cardEl) return;
  const rankSlot = cardEl.querySelector('[data-slot="osu-rank"]');
  const ppSlot = cardEl.querySelector('[data-slot="osu-pp"]');
  const accSlot = cardEl.querySelector('[data-slot="osu-acc"]');

  const res = await fetchApi('/api/osu/profile', 5 * 60_000);
  if (!res.ok || !res.data) return;

  const d = res.data;
  if (d.globalRank && rankSlot) {
    rankSlot.textContent = `#${fmt.num(d.globalRank)}`;
  }
  if (d.pp && ppSlot) {
    ppSlot.textContent = `${fmt.num(d.pp)} pp`;
  }
  if (d.accuracy && accSlot) {
    accSlot.textContent = fmt.pct(d.accuracy);
  }

  const overviewVal = document.getElementById('overview-playtime-val');
  if (overviewVal && typeof d.playTimeSeconds === 'number') {
    overviewVal.textContent = `~ ${fmt.num(Math.round(d.playTimeSeconds / 3600))}h+`;
  }
}
