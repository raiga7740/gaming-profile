import { fetchApi, formatUpdated, fmt } from '../apiClient.js';
import { error, statRow, statRows } from './cardStates.js';
import { el, setImgSrc } from './dom.js';

export async function renderRoblox(cardEl) {
  const body = cardEl.querySelector('[data-slot="body"]');
  const updated = cardEl.querySelector('[data-slot="updated"]');
  const res = await fetchApi('/api/roblox/profile', 5 * 60_000);
  updated.textContent = formatUpdated(res.fetchedAt);

  if (!res.ok) {
    return error(body, 'Roblox profile unavailable', res.error ?? '');
  }
  const d = res.data;
  if (!d) return error(body, 'Roblox profile unavailable', 'User not found.');

  // --- all external strings below are rendered via textContent ---
  const profile = el('div', { className: 'roblox-profile' });

  if (d.avatarUrl) {
    const avatar = el('img', {
      className: 'roblox-avatar',
      attrs: { alt: 'Roblox avatar', loading: 'lazy', width: '76', height: '76' },
    });
    setImgSrc(avatar, d.avatarUrl); // no fallback → helper strips untrusted URLs
    profile.append(avatar);
  } else {
    profile.append(el('div', { className: 'roblox-avatar' }));
  }

  const meta = el('div', { className: 'roblox-meta' }, [
    el('strong', { text: d.displayName ?? d.username ?? 'Unknown' }),
    el('span', { text: d.username ? `@${d.username}` : '' }),
    el('span', { text: d.userId ? `User ID: ${d.userId}` : '' }),
  ]);
  if (d.created) {
    const joined = new Date(d.created);
    if (!isNaN(joined)) {
      meta.append(el('span', {
        text: `Joined ${joined.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      }));
    }
  }
  profile.append(meta);

  const rows = statRows();
  rows.style.marginTop = '14px';
  if (fmt.num(d.friendsCount)) statRow(rows, 'Friends', fmt.num(d.friendsCount));
  statRow(rows, 'Status', d.isBanned ? 'Banned' : 'Active', d.isBanned ? 'stat-row__val--unavailable' : '');

  const descText = typeof d.description === 'string' && d.description.trim()
    ? d.description
    : 'No description set.';
  const desc = el('p', {
    className: 'roblox-desc',
    text: descText.length > 180 ? descText.slice(0, 180) + '…' : descText,
  });

  body.replaceChildren(profile, rows, desc);
}
