import { renderOsu } from './components/osuCard.js';
import { renderRoblox } from './components/robloxCard.js';
import { renderValorant } from './components/valorantCard.js';
import { renderDiscord } from './components/discordCard.js';

/* ---------- year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- nav: scrolled border + active link + mobile toggle ---------- */
const nav = document.querySelector('.nav');
const links = document.querySelectorAll('.nav__link');
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 8);
}, { passive: true });

toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
links.forEach((l) => l.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// active state via scroll position
const sections = ['home', 'games', 'about', 'socials'].map((id) => document.getElementById(id));
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((s) => s && spy.observe(s));

/* ---------- data cards (independent — one failing never breaks the others) ---------- */
const cards = (sel) => document.querySelector(`[data-card="${sel}"]`);
renderOsu(cards('osu')).catch(console.error);
renderRoblox(cards('roblox')).catch(console.error);
renderValorant(cards('valorant')).catch(console.error);
renderDiscord(cards('discord')).catch(console.error);

// refresh Discord presence periodically (matches the 45s server cache cadence)
setInterval(() => renderDiscord(cards('discord')).catch(console.error), 60_000);
