import { fetchApi, fmt } from '../apiClient.js';

export async function renderRoblox(cardEl) {
  if (!cardEl) return;
  const friendsSlot = cardEl.querySelector('[data-slot="roblox-friends"]');
  const playtimeSlot = cardEl.querySelector('[data-slot="roblox-playtime"]');
  const favoritesSlot = cardEl.querySelector('[data-slot="roblox-favorites"]');

  const res = await fetchApi('/api/roblox/profile', 5 * 60_000);
  if (!res.ok || !res.data) return;

  const d = res.data;
  if (typeof d.friendsCount === 'number' && friendsSlot) {
    friendsSlot.textContent = fmt.num(d.friendsCount);
  }
}
