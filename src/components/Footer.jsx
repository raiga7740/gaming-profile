import { motion } from 'framer-motion';

const FOOTER_SOCIALS = [
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

export default function Footer() {
  return (
    <footer className="footer">
      <div className="cyber-decal cyber-decal--bottom-right" aria-hidden="true" />

      <div className="container footer__inner">
        <div className="footer__left">
          <div className="footer__brand">
            RAIGA<span className="nav__brand-dot">.</span>
          </div>
          <p className="footer__sub">Personal Gaming Profile • Est. 2026</p>
        </div>

        <div className="footer__center">
          <span className="footer__pipe">|</span>
          <div className="footer__socials">
            {FOOTER_SOCIALS.map((social) => (
              <motion.a
                key={social.title}
                className="footer__social"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.title}
                whileHover={{ y: -2, scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
              >
                <img src={social.icon} alt={social.title} width="18" height="18" />
              </motion.a>
            ))}
          </div>
        </div>

        <div className="footer__right">
          <span className="footer__thanks">
            Thanks for visiting! <span className="footer__heart">♡</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

