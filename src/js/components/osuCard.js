import { fetchApi, formatUpdated, fmt } from '../apiClient.js';
import { error, statRow, statRows } from './cardStates.js';
import { el, setImgSrc } from './dom.js';

export async function renderOsu(cardEl) {
  const body = cardEl.querySelector('[data-slot="body"]');
  const updated = cardEl.querySelector('[data-slot="updated"]');
  const res = await fetchApi('/api/osu/profile', 5 * 60_000);
  updated.textContent = formatUpdated(res.fetchedAt);

  if (!res.ok) {
    return error(body, 'osu! stats unavailable', res.error ?? '');
  }
  const d = res.data;
  if (!d) return error(body, 'osu! stats unavailable', 'User not found.');

  const heroAvatar = document.getElementById('hero-avatar');
  if (heroAvatar && d.avatarUrl) {
    setImgSrc(heroAvatar, d.avatarUrl);
    heroAvatar.style.display = '';
    heroAvatar.parentElement?.classList.remove('is-empty');
  }

  // Values are validated numbers on the backend; still rendered as text only.
  const rows = statRows();
  statRow(rows, 'Global rank', d.globalRank ? `#${fmt.num(d.globalRank)}` : null, 'stat-row__val--rank');
  statRow(rows, 'Country rank', d.countryRank ? `#${fmt.num(d.countryRank)}` : null);
  statRow(rows, 'Performance', d.pp ? `${fmt.num(d.pp)} pp` : null);
  statRow(rows, 'Accuracy', fmt.pct(d.accuracy));
  statRow(rows, 'Play count', fmt.num(d.playCount));
  statRow(rows, 'Level', d.level ? `${d.level}` : null);
  // ponytail: round seconds to whole hours; upgrade to days/hours breakdown if profile demands it
  const playTime = typeof d.playTimeSeconds === 'number'
    ? `${fmt.num(Math.round(d.playTimeSeconds / 3600))} hrs`
    : null;
  statRow(rows, 'Official playtime', playTime);

  body.replaceChildren(rows);

  const overviewVal = document.getElementById('overview-playtime-val');
  const overviewNote = document.getElementById('overview-playtime-note');
  if (overviewVal && overviewNote && typeof d.playTimeSeconds === 'number') {
    overviewVal.className = 'stat-card__value';
    overviewVal.replaceChildren(
      document.createTextNode(fmt.num(Math.round(d.playTimeSeconds / 3600))),
      el('span', { className: 'stat-card__unit', text: 'hrs (osu!)' })
    );
    overviewNote.textContent = 'Official osu! playtime — Roblox & VALORANT unavailable.';
  }
}
