/**
 * /js/pages/login.js
 * Mock login with validation. On success, redirects to account or returnUrl.
 *
 * BACKEND SWAP: Only authService.login() needs to change — it becomes
 * a fetch() to POST /auth/login. This file is untouched.
 */

import { initHeader } from '../components/header.js';
import { login, isLoggedIn } from '../services/authService.js';

initHeader();

// If already logged in, redirect immediately
if (isLoggedIn()) {
  location.href = _returnUrl();
}

// ── DOM ───────────────────────────────────────────────────────
const form        = document.getElementById('login-form');
const emailEl     = document.getElementById('email');
const passwordEl  = document.getElementById('password');
const loginBtn    = document.getElementById('login-btn');
const globalErr   = document.getElementById('global-error');
const togglePw    = document.getElementById('toggle-pw');

// ── Password visibility toggle ────────────────────────────────
togglePw?.addEventListener('click', () => {
  const show = passwordEl.type === 'password';
  passwordEl.type    = show ? 'text' : 'password';
  togglePw.textContent = show ? 'Hide' : 'Show';
});
togglePw?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePw.click(); }
});

// ── Clear errors on input ─────────────────────────────────────
emailEl?.addEventListener('input',    () => clearError('err-email'));
passwordEl?.addEventListener('input', () => clearError('err-password'));

// ── Submit ────────────────────────────────────────────────────
form?.addEventListener('submit', async e => {
  e.preventDefault();
  hideGlobalError();

  const email    = emailEl?.value?.trim() ?? '';
  const password = passwordEl?.value ?? '';

  // Validate
  let valid = true;

  if (!email) {
    showFieldError('err-email', 'Email address is required.');
    emailEl.classList.add('error');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('err-email', 'Please enter a valid email address.');
    emailEl.classList.add('error');
    valid = false;
  }

  if (!password) {
    showFieldError('err-password', 'Password is required.');
    passwordEl.classList.add('error');
    valid = false;
  }

  if (!valid) return;

  // Submit
  setLoading(true);

  try {
    await login(email, password);
    location.href = _returnUrl();
  } catch (err) {
    showGlobalError(err.message || 'Login failed. Please try again.');
    setLoading(false);
  }
});

// ── Helpers ───────────────────────────────────────────────────
function setLoading(on) {
  loginBtn.disabled    = on;
  loginBtn.textContent = on ? 'Signing In…' : 'Sign In';
  loginBtn.classList.toggle('loading', on);
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  // Also clear the associated input's error state
  const inputId = id.replace('err-', '');
  document.getElementById(inputId)?.classList.remove('error');
}

function showGlobalError(msg) {
  if (!globalErr) return;
  globalErr.textContent = msg;
  globalErr.classList.add('visible');
}

function hideGlobalError() {
  globalErr?.classList.remove('visible');
}

function _returnUrl() {
  const p = new URLSearchParams(location.search).get('return');
  // Only allow relative paths for security
  if (p && p.startsWith('/') || (p && !p.startsWith('http'))) return p;
  return 'account.html';
}
