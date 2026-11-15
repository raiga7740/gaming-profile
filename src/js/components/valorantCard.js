import { fetchApi } from '../apiClient.js';

export async function renderValorant(cardEl) {
  if (!cardEl) return;
  const rankSlot = cardEl.querySelector('[data-slot="val-rank"]');
  const kdSlot = cardEl.querySelector('[data-slot="val-kd"]');
  const wrSlot = cardEl.querySelector('[data-slot="val-wr"]');

  const res = await fetchApi('/api/valorant/profile', 10 * 60_000);
  if (!res.ok || !res.data) return;

  const d = res.data;
  if (d.peakRank && rankSlot) {
    rankSlot.textContent = d.peakRank;
  }
  if (typeof d.kdRatio === 'number' && kdSlot) {
    kdSlot.textContent = d.kdRatio.toFixed(2);
  }
  if (typeof d.winRate === 'number' && wrSlot) {
    wrSlot.textContent = `${d.winRate}%`;
  }
}
