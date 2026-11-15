import { fetchApi, formatUpdated } from '../apiClient.js';
import { error } from './cardStates.js';
import { el, setImgSrc, safeClass } from './dom.js';

const STATUS_LABEL = { online: 'Online', idle: 'Idle', dnd: 'Do not disturb', offline: 'Offline', unknown: 'Presence unavailable' };
const STATUS_CLASS = ['online', 'idle', 'dnd', 'offline'];
const DISCORD_ICON = '/assets/icons/discord.svg';

/** Neutral identity header used whenever live data is missing. Never fabricates a handle. */
function neutralHead(message) {
  return el('div', { className: 'discord-head' }, [
    el('img', { className: 'discord-avatar', attrs: { src: DISCORD_ICON, alt: '', loading: 'lazy' } }),
    el('div', { className: 'discord-names' }, [
      el('strong', { text: 'Raiga' }),
      el('span', { text: message }),
    ]),
  ]);
}

function statusLine(status) {
  const label = STATUS_LABEL[status] ?? 'Presence unavailable';
  const dotClass = STATUS_CLASS.includes(status) ? ` ${safeClass(status, 'status-dot--', STATUS_CLASS, 'offline')}` : '';
  return el('div', { className: 'discord-status' }, [
    el('span', {
      className: `status-dot${dotClass}`,
    }),
    document.createTextNode(label),
  ]);
}

export async function renderDiscord(cardEl) {
  const body = cardEl.querySelector('[data-slot="body"]');
  const res = await fetchApi('/api/discord/presence', 30_000);

  if (!res.ok) {
    // Graceful fallback — the card stays functional, no fake status.
    body.replaceChildren(
      neutralHead('Discord'),
      statusLine('unknown'),
      el('div', { className: 'discord-custom', text: "Live status can't be fetched right now — check back later." })
    );
    return;
  }

  const d = res.data;
  if (!d || d.monitored === false) {
    body.replaceChildren(
      neutralHead('Discord'),
      statusLine('unknown'),
      el('div', {
        className: 'discord-custom',
        text: "This Discord account isn't opted into Lanyard yet, so live presence can't be shown. Status is never faked here.",
      })
    );
    return;
  }

  // --- live data: every string below is external → textContent only ---
  const displayName = d.displayName ?? d.username ?? 'Raiga';
  const handleText = d.username ? `@${d.username}` : 'Discord';

  const head = el('div', { className: 'discord-head' }, [
    el('img', { className: 'discord-avatar', attrs: { alt: 'Discord avatar', loading: 'lazy' } }),
    el('div', { className: 'discord-names' }, [
      el('strong', { text: displayName }),
      el('span', { text: handleText }),
    ]),
  ]);
  setImgSrc(head.querySelector('img'), d.avatarUrl, DISCORD_ICON);

  const parts = [head, statusLine(d.status)];

  if (d.activity && typeof d.activity.name === 'string') {
    const activityBox = el('div', { className: 'discord-activity' }, [
      el('div', { className: 'discord-activity__game', text: `Playing ${d.activity.name}` }),
    ]);
    for (const detail of [d.activity.details, d.activity.state]) {
      if (typeof detail === 'string' && detail.trim()) {
        activityBox.append(el('div', { className: 'discord-activity__detail', text: detail }));
      }
    }
    parts.push(activityBox);
  }

  if (typeof d.customStatus === 'string' && d.customStatus.trim()) {
    parts.push(el('div', { className: 'discord-custom', text: `“${d.customStatus}”` }));
  }

  body.replaceChildren(...parts);
}
