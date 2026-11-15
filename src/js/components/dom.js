/**
 * Safe DOM helpers.
 *
 * Rule: external API strings (usernames, statuses, descriptions, activity
 * names, image URLs, …) are NEVER inserted as HTML. They are only ever
 * assigned via textContent / validated attributes, so characters like
 * <script>, " or onerror= can never break out into markup.
 */

/**
 * Create an element, set properties (textContent, className, attributes via
 * dataset/attrs), and append children.
 *
 * @param {string} tag
 * @param {{ className?: string, text?: string, attrs?: Record<string,string> }} [props]
 * @param {Array<Node|string>} [children] strings are appended as text nodes (safe)
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/**
 * Only allow image URLs from vetted HTTPS origins. Anything else returns null
 * and the caller renders a neutral fallback. This blocks `javascript:`,
 * `data:`, and attacker-controlled hosts from ever reaching an <img src>.
 */
const ALLOWED_IMG_PREFIXES = [
  'https://cdn.discordapp.com/avatars/',
  'https://cdn.discordapp.com/embed/',
  'https://cdn.discordapp.com/app-assets/',
  'https://tr.rbxcdn.com/',
  'https://images.rbxcdn.com/',
  'https://a.ppy.sh/',
  'https://assets.ppy.sh/',
];

export function safeImageUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  return ALLOWED_IMG_PREFIXES.some((p) => trimmed.startsWith(p)) ? trimmed : null;
}

/** Set an <img> src from an untrusted URL with a safe fallback. */
export function setImgSrc(img, url, fallbackSrc) {
  const safe = safeImageUrl(url);
  if (safe) {
    img.src = safe;
  } else if (fallbackSrc) {
    img.src = fallbackSrc;
  } else {
    img.removeAttribute('src');
  }
}

/** CSS class names for statuses must come from a fixed whitelist, never raw data. */
export function safeClass(value, prefix, allowed, fallback) {
  return allowed.includes(value) ? `${prefix}${value}` : `${prefix}${fallback}`;
}
