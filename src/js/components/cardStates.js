/**
 * Shared card-state renderers (loading / error / empty) and stat rows.
 * All content is set through safe DOM APIs — no HTML string interpolation.
 */
import { el } from './dom.js';

export function loading(node, text = 'Loading…') {
  node.replaceChildren(
    el('div', { className: 'card-loading' }, [
      el('span', { className: 'spinner' }),
      document.createTextNode(text),
    ])
  );
}

export function error(node, title = 'Something went wrong', message = '') {
  node.replaceChildren(
    el('div', { className: 'card-error' }, [
      el('strong', { text: title }),          // static strings from our own code
      el('span', { text: message }),          // backend message via textContent — safe
    ])
  );
}

export function empty(node, message = 'No data available.') {
  node.replaceChildren(
    el('div', { className: 'card-empty' }, [el('span', { text: message })])
  );
}

/**
 * One stat row. `value` is rendered as plain text — numbers, our own labels,
 * or pre-formatted strings. null/undefined renders a neutral "n/a".
 */
export function statRow(container, key, value, cls = '') {
  const valueEl = value === null || value === undefined || value === ''
    ? el('span', { className: 'stat-row__val stat-row__val--unavailable', text: 'n/a' })
    : el('span', { className: `stat-row__val ${cls}`.trim(), text: String(value) });

  container.append(
    el('div', { className: 'stat-row' }, [
      el('span', { className: 'stat-row__key', text: key }),
      valueEl,
    ])
  );
}

export function statRows() {
  return el('div', { className: 'stat-rows' });
}
