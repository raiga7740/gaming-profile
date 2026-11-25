import { motion } from 'framer-motion';

const SOCIALS = [
  {
    title: 'Discord',
    href: 'https://discord.com/users/610382027002478612',
    icon: '/assets/icons/discord.svg',
  },
  {
    title: 'Steam',
    href: 'https://steamcommunity.com/profiles/76561198983428903/',
    icon: '/assets/icons/steam.svg',
  },
  {
    title: 'YouTube',
    href: 'https://youtube.com/@raiga_v',
    icon: '/assets/icons/youtube.svg',
  },
  {
    title: 'X',
    href: 'https://x.com/@raigafp0u',
    icon: '/assets/icons/x.svg',
  },
];

const springEase = [0.16, 1, 0.3, 1];

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="container hero__inner">
        <div className="hero__left">
          <motion.div
            className="hero__avatar-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: springEase }}
            whileHover={{ scale: 1.03 }}
          >
            <div className="hero__avatar-ring">
              <div className="hero__avatar-inner">
                <img id="hero-avatar" src="/assets/images/alya.gif" alt="Raiga" />
              </div>
            </div>
            <span className="hero__status-dot" title="Online" />
          </motion.div>

          <motion.div
            className="hero__content"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: springEase }}
          >
            <div className="hero__badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="12" x2="10" y2="12" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="15" y1="13" x2="15.01" y2="13" />
                <line x1="18" y1="11" x2="18.01" y2="11" />
                <rect x="2" y="6" width="20" height="12" rx="6" />
              </svg>
              <span>GAMING PROFILE</span>
            </div>

            <h1 className="hero__title">
              Hey, I&apos;m <span className="hero__title-accent">Raiga.</span>
            </h1>
            <p className="hero__subtitle">Gaming is part of my story.</p>
            <p className="hero__games-line">osu! / Roblox / VALORANT</p>

            <div className="hero__socials">
              {SOCIALS.map((social) => (
                <motion.a
                  key={social.title}
                  className="social-btn"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.title}
                  whileHover={{ y: -3, scale: 1.07 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                >
                  <img src={social.icon} alt={social.title} width="18" height="18" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero__right"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: springEase }}
        >
          <motion.div
            className="hero__art-wrapper"
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <img src="/assets/icons/images/background.gif" alt="Raiga artwork" className="hero__art-img" />
            <div className="hero__cyber-stripes" aria-hidden="true">
              <span className="hero__cyber-stripe" />
              <span className="hero__cyber-stripe" />
              <span className="hero__cyber-stripe" />
            </div>
          </motion.div>
          <p className="hero__quote">“ Just a player, chasing better gameplay. ”</p>
        </motion.div>
      </div>
    </section>
  );
}

