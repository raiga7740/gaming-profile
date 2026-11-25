import { fetchApi } from '../apiClient.js';
import { setImgSrc, safeClass } from './dom.js';

const STATUS_LABEL = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
  unknown: 'Presence unavailable',
};

export async function renderDiscord(cardEl) {
  if (!cardEl) return;
  const avatarImg = document.getElementById('discord-avatar-img');
  const usernameEl = document.getElementById('discord-username');
  const statusEl = document.getElementById('discord-status');
  const statusText = document.getElementById('discord-status-text');
  const activityBox = document.getElementById('discord-activity');
  const activityGame = document.getElementById('discord-activity-game');
  const activityTime = document.getElementById('discord-activity-time');

  const res = await fetchApi('/api/discord/presence', 30_000);
  if (!res.ok || !res.data || res.data.monitored === false) {
    return;
  }

  const d = res.data;
  const displayName = d.displayName ?? d.username ?? 'Raiga';
  if (usernameEl) usernameEl.textContent = displayName;

  if (avatarImg && d.avatarUrl) {
    setImgSrc(avatarImg, d.avatarUrl, '/assets/icons/discord.svg');
  }

  const status = d.status || 'online';
  const statusLabel = STATUS_LABEL[status] || 'Online';

  if (statusEl && statusText) {
    statusText.textContent = statusLabel;
    const dot = statusEl.querySelector('.status-dot');
    if (dot) {
      dot.className = `status-dot ${safeClass(status, 'status-dot--', ['online', 'idle', 'dnd', 'offline'], 'offline')}`;
    }
  }

  if (d.activity && typeof d.activity.name === 'string') {
    if (activityGame) activityGame.textContent = `Playing ${d.activity.name}`;
    if (activityTime) {
      activityTime.textContent = d.activity.details || d.activity.state || 'Active now';
    }
    if (activityBox) activityBox.style.display = 'flex';
  } else {
    if (activityGame) {
      activityGame.textContent = d.customStatus || 'No current activity';
    }
    if (activityTime) {
      activityTime.textContent = d.customStatus ? statusLabel : 'Currently chilling';
    }
    if (activityBox) activityBox.style.display = 'flex';
  }
}
