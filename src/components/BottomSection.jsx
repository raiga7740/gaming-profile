import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchApi } from '../js/apiClient.js';
import { safeImageUrl, safeClass } from '../js/components/dom.js';

const STATUS_LABEL = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
  unknown: 'Presence unavailable',
};

const TAGS = ['Gamer', 'Anime', 'Tech Enthusiast', 'Chill Vibes'];

export default function BottomSection() {
  const [discord, setDiscord] = useState({
    displayName: 'Raiga',
    avatarUrl: '/assets/icons/discord.svg',
    status: 'online',
    statusLabel: 'Online',
    activityTitle: 'Playing VALORANT',
    activitySub: 'for 2h 14m',
  });

  useEffect(() => {
    let active = true;

    const loadPresence = () => {
      fetchApi('/api/discord/presence', 30_000)
        .then((res) => {
          if (!active || !res.ok || !res.data || res.data.monitored === false) return;
          const d = res.data;
          const status = d.status || 'online';
          const statusLabel = STATUS_LABEL[status] || 'Online';
          const safeAvatar = safeImageUrl(d.avatarUrl) || '/assets/icons/discord.svg';
          const hasActivity = d.activity && typeof d.activity.name === 'string';

          setDiscord({
            displayName: d.displayName ?? d.username ?? 'Raiga',
            avatarUrl: safeAvatar,
            status,
            statusLabel,
            activityTitle: hasActivity
              ? `Playing ${d.activity.name}`
              : d.customStatus || 'No current activity',
            activitySub: hasActivity
              ? d.activity.details || d.activity.state || 'Active now'
              : d.customStatus
                ? statusLabel
                : 'Currently chilling',
          });
        })
        .catch(console.error);
    };

    loadPresence();
    const timer = setInterval(loadPresence, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const dotClass = `status-dot ${safeClass(
    discord.status,
    'status-dot--',
    ['online', 'idle', 'dnd', 'offline'],
    'offline'
  )}`;

  return (
    <section className="section" id="about">
      <div className="container bottom-grid">
        <div className="bottom-col">
          <div className="section-head">
            <h2 className="section-title">
              <span className="slashes" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              DISCORD PROFILE
            </h2>
            <a
              href="https://discord.com/users/610382027002478612"
              target="_blank"
              rel="noopener noreferrer"
              className="section-link"
            >
              View Profile <span className="arrow">→</span>
            </a>
          </div>

          <motion.article
            className="discord-card"
            data-card="discord"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="discord-card__top">
              <div className="discord-card__user">
                <div className="discord-avatar-wrap">
                  <img
                    id="discord-avatar-img"
                    src={discord.avatarUrl}
                    alt="Discord"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/icons/discord.svg';
                    }}
                  />
                </div>
                <div className="discord-card__names">
                  <div className="discord-card__name-row">
                    <strong className="discord-card__username" id="discord-username">
                      {discord.displayName}
                    </strong>
                    <span className="discord-verified" title="Verified">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  </div>
                  <div className="discord-card__status" id="discord-status">
                    <span className={dotClass} />
                    <span id="discord-status-text">{discord.statusLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="discord-card__divider">
              <span>CURRENT ACTIVITY</span>
            </div>

            <div className="discord-activity-box" id="discord-activity">
              <div className="discord-activity__details">
                <div className="discord-activity__game" id="discord-activity-game">
                  {discord.activityTitle}
                </div>
                <div className="discord-activity__time" id="discord-activity-time">
                  {discord.activitySub}
                </div>
              </div>
            </div>
          </motion.article>
        </div>

        <div className="bottom-col">
          <div className="section-head">
            <h2 className="section-title">
              <span className="slashes" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              ABOUT ME
            </h2>
          </div>

          <motion.article
            className="about-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="about-card__content">
              <p className="about-card__text">
                A passionate gamer who loves rhythm games, competitive{' '}
                <span className="highlight-underline">FPS</span>, and exploring new worlds.
              </p>
              <p className="about-card__text">
                Always looking for good games, great friends, and unforgettable moments.
              </p>

              <div className="about-card__tags">
                {TAGS.map((tag) => (
                  <motion.span
                    key={tag}
                    className="about-tag"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="about-card__game-on" aria-hidden="true">
              <span className="game-on-text">Game On!</span>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

