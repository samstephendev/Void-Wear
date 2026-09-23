/**
 * /js/utils/storage.js
 * ─────────────────────────────────────────────────────────────
 * Centralised localStorage wrapper.
 * All read/write operations to localStorage go through here —
 * never call localStorage directly from service or page code.
 *
 * BACKEND SWAP: If you move to server-side sessions or a remote
 * cache, swap the implementation of these functions only. All
 * callers remain unchanged.
 * ─────────────────────────────────────────────────────────────
 */

const PREFIX = 'voidwear_';

/**
 * Persist a value under `key`. The value is JSON-serialised.
 * @param {string} key
 * @param {*} value
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('[storage] setItem failed:', key, err);
  }
}

/**
 * Retrieve and JSON-parse the value stored under `key`.
 * Returns `defaultValue` if the key is absent or JSON is invalid.
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[storage] getItem failed:', key, err);
    return defaultValue;
  }
}

/**
 * Remove the entry stored under `key`.
 * @param {string} key
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (err) {
    console.warn('[storage] removeItem failed:', key, err);
  }
}

/**
 * Remove all voidwear_ prefixed entries from localStorage.
 */
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[storage] clearAll failed:', err);
  }
}

/**
 * Check whether a key exists in storage.
 * @param {string} key
 * @returns {boolean}
 */
export function hasItem(key) {
  try {
    return localStorage.getItem(PREFIX + key) !== null;
  } catch {
    return false;
  }
}

// ── Named storage keys (single source of truth) ──────────────
export const KEYS = {
  CART:      'cart',
  WISHLIST:  'wishlist',
  AUTH_USER: 'auth_user',
  MOCK_USERS:'mock_users',   // persisted user registry for signup
  ORDERS:    'orders',
};
