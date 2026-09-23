/**
 * /js/pages/signup.js
 * Mock signup with validation + password strength meter.
 *
 * BACKEND SWAP: Only authService.signup() needs to change — it becomes
 * a fetch() to POST /auth/signup. This file is untouched.
 */

import { initHeader } from '../components/header.js';
import { signup, isLoggedIn } from '../services/authService.js';

initHeader();

// Already logged in → redirect
if (isLoggedIn()) location.href = 'account.html';

// ── DOM ───────────────────────────────────────────────────────
const form          = document.getElementById('signup-form');
const firstNameEl   = document.getElementById('first-name');
const lastNameEl    = document.getElementById('last-name');
const emailEl       = document.getElementById('email');
const passwordEl    = document.getElementById('password');
const confirmPwEl   = document.getElementById('confirm-password');
const signupBtn     = document.getElementById('signup-btn');
const globalErr     = document.getElementById('global-error');
const togglePw      = document.getElementById('toggle-pw');
const strengthBar   = document.getElementById('strength-bar');
const strengthLabel = document.getElementById('strength-label');

// ── Password visibility ───────────────────────────────────────
togglePw?.addEventListener('click', () => {
  const show = passwordEl.type === 'password';
  passwordEl.type      = show ? 'text' : 'password';
  togglePw.textContent = show ? 'Hide' : 'Show';
});
togglePw?.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePw.click(); }
});

// ── Password strength meter ───────────────────────────────────
passwordEl?.addEventListener('input', () => {
  const v   = passwordEl.value;
  const score = _scorePassword(v);
  const pcts  = [0, 25, 50, 75, 100];
  const clrs  = ['', '#ff2d2d', '#ff8c00', '#f5c518', '#b8f53a'];
  const lbls  = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  strengthBar.style.width      = `${pcts[score]}%`;
  strengthBar.style.background = clrs[score];
  strengthLabel.textContent    = lbls[score];
  strengthLabel.style.color    = clrs[score];
  clearError('err-password');
});

function _scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// ── Clear errors on input ─────────────────────────────────────
[
  ['first-name', 'err-first-name'],
  ['last-name',  'err-last-name'],
  ['email',      'err-email'],
  ['confirm-password', 'err-confirm-password'],
].forEach(([inputId, errId]) => {
  document.getElementById(inputId)?.addEventListener('input', () => clearError(errId));
});

// ── Submit ────────────────────────────────────────────────────
form?.addEventListener('submit', async e => {
  e.preventDefault();
  hideGlobalError();

  const firstName = firstNameEl?.value?.trim()  ?? '';
  const lastName  = lastNameEl?.value?.trim()   ?? '';
  const email     = emailEl?.value?.trim()      ?? '';
  const password  = passwordEl?.value           ?? '';
  const confirm   = confirmPwEl?.value          ?? '';

  let valid = true;

  if (!firstName) {
    showFieldError('err-first-name', 'First name is required.');
    firstNameEl.classList.add('error'); valid = false;
  }
  if (!lastName) {
    showFieldError('err-last-name', 'Last name is required.');
    lastNameEl.classList.add('error'); valid = false;
  }
  if (!email) {
    showFieldError('err-email', 'Email address is required.');
    emailEl.classList.add('error'); valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('err-email', 'Please enter a valid email address.');
    emailEl.classList.add('error'); valid = false;
  }
  if (!password) {
    showFieldError('err-password', 'Password is required.');
    passwordEl.classList.add('error'); valid = false;
  } else if (password.length < 8) {
    showFieldError('err-password', 'Password must be at least 8 characters.');
    passwordEl.classList.add('error'); valid = false;
  }
  if (!confirm) {
    showFieldError('err-confirm-password', 'Please confirm your password.');
    confirmPwEl.classList.add('error'); valid = false;
  } else if (password !== confirm) {
    showFieldError('err-confirm-password', 'Passwords do not match.');
    confirmPwEl.classList.add('error'); valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    await signup({ firstName, lastName, email, password });
    location.href = 'account.html';
  } catch (err) {
    showGlobalError(err.message || 'Sign up failed. Please try again.');
    setLoading(false);
  }
});

// ── Helpers ───────────────────────────────────────────────────
function setLoading(on) {
  signupBtn.disabled    = on;
  signupBtn.textContent = on ? 'Creating Account…' : 'Create Account';
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
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
