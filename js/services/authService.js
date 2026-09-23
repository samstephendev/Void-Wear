/**
 * /js/services/authService.js
 * ─────────────────────────────────────────────────────────────
 * Mock authentication backed by localStorage.
 * All auth operations go through this file exclusively.
 *
 * BACKEND SWAP: Replace function bodies with fetch() calls to
 * your auth endpoints. Signatures stay the same:
 *
 *   login(email, password)  → POST /auth/login
 *   signup(data)            → POST /auth/signup
 *   logout()                → POST /auth/logout  (or clear token)
 *   getCurrentUser()        → GET  /auth/me
 *   updateProfile(data)     → PUT  /auth/me
 *   addAddress(addr)        → POST /auth/me/addresses
 *   removeAddress(id)       → DELETE /auth/me/addresses/:id
 *
 * Auth state (current user) is persisted in localStorage under
 * KEYS.AUTH_USER so it survives page reloads.
 * ─────────────────────────────────────────────────────────────
 */

import { MOCK_USERS } from '../data/users.js';
import { getItem, setItem, removeItem, KEYS } from '../utils/storage.js';

const FAKE_DELAY = 500;
const delay = (ms = FAKE_DELAY) => new Promise(r => setTimeout(r, ms));

// ── Internal helpers ──────────────────────────────────────────

/** Get the live user registry (seed from mock data if first run) */
function getUserRegistry() {
  const stored = getItem(KEYS.MOCK_USERS);
  if (!stored) {
    // Seed with mock users on first load
    setItem(KEYS.MOCK_USERS, MOCK_USERS);
    return [...MOCK_USERS];
  }
  return stored;
}

function saveUserRegistry(users) {
  setItem(KEYS.MOCK_USERS, users);
}

function generateId() {
  return 'usr_' + Math.random().toString(36).slice(2, 10);
}

function sanitizeUser(user) {
  // Never expose the password field outside this service
  const { password: _pw, ...safe } = user;
  return safe;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Log in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object }>}
 * @throws {Error} if credentials are invalid
 */
export async function login(email, password) {
  await delay();
  const users = getUserRegistry();
  const found = users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!found) {
    throw new Error('Invalid email or password.');
  }
  const safeUser = sanitizeUser(found);
  setItem(KEYS.AUTH_USER, safeUser);
  return { user: safeUser };
}

/**
 * Register a new account.
 * @param {{ firstName:string, lastName:string, email:string, password:string }} data
 * @returns {Promise<{ user: object }>}
 * @throws {Error} if email already registered
 */
export async function signup({ firstName, lastName, email, password }) {
  await delay();
  const users = getUserRegistry();
  const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }
  const newUser = {
    id:        generateId(),
    email:     email.trim().toLowerCase(),
    password,
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    avatar:    (firstName[0] + lastName[0]).toUpperCase(),
    createdAt: new Date().toISOString(),
    addresses: [],
    wishlist:  [],
  };
  users.push(newUser);
  saveUserRegistry(users);
  const safeUser = sanitizeUser(newUser);
  setItem(KEYS.AUTH_USER, safeUser);
  return { user: safeUser };
}

/**
 * Log out the current user.
 * @returns {Promise<void>}
 */
export async function logout() {
  await delay(200);
  removeItem(KEYS.AUTH_USER);
}

/**
 * Get the currently authenticated user from storage.
 * Returns null if not logged in.
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  // No delay — this is a local read used on every page load
  return getItem(KEYS.AUTH_USER, null);
}

/**
 * Synchronous version of getCurrentUser — used in header init.
 * @returns {object|null}
 */
export function getCurrentUserSync() {
  return getItem(KEYS.AUTH_USER, null);
}

/**
 * Check if a user is currently logged in.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return getItem(KEYS.AUTH_USER, null) !== null;
}

/**
 * Update the current user's profile fields.
 * @param {{ firstName?:string, lastName?:string }} data
 * @returns {Promise<{ user: object }>}
 */
export async function updateProfile(data) {
  await delay(400);
  const current = getItem(KEYS.AUTH_USER);
  if (!current) throw new Error('Not authenticated.');

  const users = getUserRegistry();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('User not found.');

  Object.assign(users[idx], data);
  saveUserRegistry(users);

  const updated = sanitizeUser(users[idx]);
  setItem(KEYS.AUTH_USER, updated);
  return { user: updated };
}

/**
 * Add a new address to the current user's profile.
 * @param {object} address
 * @returns {Promise<{ user: object }>}
 */
export async function addAddress(address) {
  await delay(400);
  const current = getItem(KEYS.AUTH_USER);
  if (!current) throw new Error('Not authenticated.');

  const users = getUserRegistry();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('User not found.');

  const newAddr = {
    id: 'addr_' + Math.random().toString(36).slice(2, 8),
    isDefault: users[idx].addresses.length === 0,
    ...address,
  };
  users[idx].addresses.push(newAddr);
  saveUserRegistry(users);

  const updated = sanitizeUser(users[idx]);
  setItem(KEYS.AUTH_USER, updated);
  return { user: updated };
}

/**
 * Remove an address by ID from the current user's profile.
 * @param {string} addressId
 * @returns {Promise<{ user: object }>}
 */
export async function removeAddress(addressId) {
  await delay(400);
  const current = getItem(KEYS.AUTH_USER);
  if (!current) throw new Error('Not authenticated.');

  const users = getUserRegistry();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error('User not found.');

  users[idx].addresses = users[idx].addresses.filter(a => a.id !== addressId);
  saveUserRegistry(users);

  const updated = sanitizeUser(users[idx]);
  setItem(KEYS.AUTH_USER, updated);
  return { user: updated };
}
