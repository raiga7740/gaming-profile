import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchApi, fmt } from '../js/apiClient.js';

function handleCardMouseMove(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
}

function GlassGameCard({ index, cardKey, className, banner, logo, logoClass, title, subtitle, stats, profileUrl }) {
  return (
    <motion.article
      className={`game-card ${className}`}
      data-card={cardKey}
      onMouseMove={handleCardMouseMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <div className="game-card__banner" style={{ backgroundImage: `url('${banner}')` }}>
        <div className="game-card__banner-overlay" />
        <div className="game-card__header-content">
          <img src={logo} alt={title} className={`game-card__logo ${logoClass}`} />
          <div className="game-card__title-wrap">
            <h3 className="game-card__title">{title}</h3>
            <span className="game-card__subtitle">{subtitle}</span>
          </div>
        </div>
      </div>

      <div className="game-card__stats-grid">
        {stats.map((stat) => (
          <div className="game-stat" key={stat.slot}>
            <span className="game-stat__value" data-slot={stat.slot}>
              {stat.value}
            </span>
            <span className="game-stat__label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="game-card__footer">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="game-card__btn">
          View Profile <span className="arrow">→</span>
        </a>
      </div>
    </motion.article>
  );
}

export default function GamesSection({ onOsuPlaytime }) {
  const [osu, setOsu] = useState({ rank: '#74,751', pp: '5,782.64 pp', acc: '96.08%' });
  const [roblox, setRoblox] = useState({ friends: '230', playtime: '732h+', favorites: '215' });
  const [valorant, setValorant] = useState({ rank: 'Diamond 3', kd: '1.07', wr: '40%' });

  useEffect(() => {
    let active = true;

    fetchApi('/api/osu/profile', 5 * 60_000)
      .then((res) => {
        if (!active || !res.ok || !res.data) return;
        const d = res.data;
        setOsu((prev) => ({
          rank: d.globalRank ? `#${fmt.num(d.globalRank)}` : prev.rank,
          pp: d.pp
            ? `${
                typeof d.pp === 'number'
                  ? d.pp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : d.pp
              } pp`
            : prev.pp,
          acc: d.accuracy ? fmt.pct(d.accuracy) : prev.acc,
        }));
        if (typeof d.playTimeSeconds === 'number' && onOsuPlaytime) {
          onOsuPlaytime(d.playTimeSeconds);
        }
      })
      .catch(console.error);

    fetchApi('/api/roblox/profile', 5 * 60_000)
      .then((res) => {
        if (!active || !res.ok || !res.data) return;
        const d = res.data;
        if (typeof d.friendsCount === 'number') {
          setRoblox((prev) => ({ ...prev, friends: fmt.num(d.friendsCount) }));
        }
      })
      .catch(console.error);

    fetchApi('/api/valorant/profile', 10 * 60_000)
      .then((res) => {
        if (!active || !res.ok || !res.data) return;
        const d = res.data;
        setValorant((prev) => ({
          rank: d.peakRank || prev.rank,
          kd: typeof d.kdRatio === 'number' ? d.kdRatio.toFixed(2) : prev.kd,
          wr: typeof d.winRate === 'number' ? `${d.winRate}%` : prev.wr,
        }));
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [onOsuPlaytime]);

  return (
    <section className="section" id="games">
      <div className="container">
        <div className="section-head">
          <h2 className="section-title">
            <span className="slashes" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            MY GAMES
          </h2>
          <a href="#games" className="section-link">
            View All <span className="arrow">→</span>
          </a>
        </div>

        <div className="games-grid">
          <GlassGameCard
            index={0}
            cardKey="osu"
            className="game-card--osu"
            banner="/assets/images/osu-banner.jpg"
            logo="/assets/icons/osu_logo.jpg"
            logoClass="game-card__logo--round"
            title="osu!"
            subtitle="Rhythm Game"
            profileUrl="https://osu.ppy.sh/users/Raiga7740"
            stats={[
              { slot: 'osu-rank', value: osu.rank, label: 'Global Rank' },
              { slot: 'osu-pp', value: osu.pp, label: 'Performance' },
              { slot: 'osu-acc', value: osu.acc, label: 'Accuracy' },
            ]}
          />

          <GlassGameCard
            index={1}
            cardKey="roblox"
            className="game-card--roblox"
            banner="/assets/images/roblox-banner.jpg"
            logo="/assets/icons/roblox_logo.jpg"
            logoClass="game-card__logo--squircle"
            title="Roblox"
            subtitle="Sandbox"
            profileUrl="https://www.roblox.com/users/1097007394/profile"
            stats={[
              { slot: 'roblox-friends', value: roblox.friends, label: 'Friends' },
              { slot: 'roblox-playtime', value: roblox.playtime, label: 'Playtime' },
              { slot: 'roblox-favorites', value: roblox.favorites, label: 'Favorites' },
            ]}
          />

          <GlassGameCard
            index={2}
            cardKey="valorant"
            className="game-card--valorant"
            banner="/assets/images/valorant-banner.jpg"
            logo="/assets/icons/valorant_logo.jpg"
            logoClass="game-card__logo--squircle"
            title="VALORANT"
            subtitle="Tactical FPS"
            profileUrl="https://tracker.gg/valorant/profile/riot/haerin%2310927/overview"
            stats={[
              { slot: 'val-rank', value: valorant.rank, label: 'Peak Rank' },
              { slot: 'val-kd', value: valorant.kd, label: 'K/D Ratio' },
              { slot: 'val-wr', value: valorant.wr, label: 'Win Rate' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

