import { renderOsu } from './components/osuCard.js';
import { renderRoblox } from './components/robloxCard.js';
import { renderValorant } from './components/valorantCard.js';
import { renderDiscord } from './components/discordCard.js';

/* ---------- nav: scrolled border + active link + mobile toggle ---------- */
const nav = document.querySelector('.nav');
const links = document.querySelectorAll('.nav__link');
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  if (nav) {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
}, { passive: true });

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.forEach((l) => l.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

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

/* ---------- Theme toggle (Sun / Moon) with persistence ---------- */
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.theme-toggle__icon--sun');
const moonIcon = document.querySelector('.theme-toggle__icon--moon');

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) {
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {
      // Ignore if localStorage is restricted
    }
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
    themeToggle.setAttribute(
      'title',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }

  if (sunIcon && moonIcon) {
    sunIcon.classList.toggle('is-active', theme === 'light');
    moonIcon.classList.toggle('is-active', theme === 'dark');
  }
}

// Sync icons and attributes with currently applied theme
const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
applyTheme(initialTheme, false);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  });
}

// Watch system color scheme changes if user hasn't explicitly set a preference
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try {
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    } catch (_) {}
  });
}

/* ---------- data cards (independent — one failing never breaks the others) ---------- */
const cards = (sel) => document.querySelector(`[data-card="${sel}"]`);
renderOsu(cards('osu')).catch(console.error);
renderRoblox(cards('roblox')).catch(console.error);
renderValorant(cards('valorant')).catch(console.error);
renderDiscord(cards('discord')).catch(console.error);

// refresh Discord presence periodically (matches the server cache cadence)
setInterval(() => renderDiscord(cards('discord')).catch(console.error), 60_000);
