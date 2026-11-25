import { motion } from 'framer-motion';
import { fmt } from '../js/apiClient.js';

export default function OverviewBar({ osuPlaytimeSeconds }) {
  const playtimeText =
    typeof osuPlaytimeSeconds === 'number'
      ? `~ ${fmt.num(Math.round(osuPlaytimeSeconds / 3600))}h+`
      : '~ 1,500h+';

  return (
    <section className="overview-section" id="overview">
      <div className="container">
        <motion.div
          className="overview-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="overview-item">
            <div className="overview-icon overview-icon--chart">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="12" width="4" height="9" rx="1" />
                <rect x="10" y="8" width="4" height="13" rx="1" />
                <rect x="17" y="3" width="4" height="18" rx="1" />
              </svg>
            </div>
            <div className="overview-info">
              <span className="overview-label">Total Playtime</span>
              <span className="overview-value" id="overview-playtime-val">
                {playtimeText}
              </span>
            </div>
          </div>

          <div className="overview-item">
            <div className="overview-icon overview-icon--trophy">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1c1.8-.46 3.17-1.92 3.61-3.96C19.08 11.63 21 9.55 21 7V5h-2zm-14 3V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
            </div>
            <div className="overview-info">
              <span className="overview-label">Games Played</span>
              <span className="overview-value">3+</span>
            </div>
          </div>

          <div className="overview-item">
            <div className="overview-icon overview-icon--star">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div className="overview-info">
              <span className="overview-label">Favorite Game</span>
              <span className="overview-value">osu!</span>
            </div>
          </div>

          <div className="overview-item">
            <div className="overview-icon overview-icon--heart">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div className="overview-info">
              <span className="overview-label">Good Vibes</span>
              <span className="overview-value">Always ♡</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

