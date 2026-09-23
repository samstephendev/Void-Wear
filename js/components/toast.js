/**
 * /js/components/toast.js
 * ─────────────────────────────────────────────────────────────
 * Lightweight toast notification system.
 * Usage:
 *   import { showToast } from '../components/toast.js';
 *   showToast('Added to cart', 'VOID LOGO TEE — Black / L');
 *   showToast('Error message', 'details', 'error');
 * ─────────────────────────────────────────────────────────────
 */

let _container = null;

function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    _container.setAttribute('aria-live', 'polite');
    _container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(_container);
  }
  return _container;
}

/**
 * Show a toast notification.
 * @param {string} title
 * @param {string} [body='']
 * @param {'success'|'error'} [type='success']
 * @param {number} [duration=3200]
 */
export function showToast(title, body = '', type = 'success', duration = 3200) {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    ${body ? `<div class="toast-body">${body}</div>` : ''}
  `;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}
