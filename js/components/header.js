/**
 * /js/components/header.js
 * ─────────────────────────────────────────────────────────────
 * Injects the site header into every page, wires up:
 *   - Mobile hamburger nav
 *   - Live search (delegates to productService)
 *   - Cart + wishlist badge counts (from services, sync reads)
 *   - Auth-aware nav items (login vs account link)
 *   - Active nav link highlighting
 * ─────────────────────────────────────────────────────────────
 */

import { searchProducts } from '../services/productService.js';
import { getCartCountSync } from '../services/cartService.js';
import { getWishlistCountSync } from '../services/wishlistService.js';
import { getCurrentUserSync } from '../services/authService.js';

// ── SVG icon helpers ──────────────────────────────────────────
const ICONS = {
  search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06
    1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,
  cart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`,
};

// ── Build header HTML ─────────────────────────────────────────
function buildHeaderHTML(cartCount, wishlistCount, user) {
  // When logged in: icon link to account. When logged out: prominent text button + icon.
  const authLink = user
    ? `<a href="account.html" title="My Account — ${user.firstName}" aria-label="My Account">
         ${ICONS.user}
       </a>`
    : `<a href="login.html" class="btn btn-secondary btn-sm"
          style="font-size:var(--fs-xs);padding:6px 14px;letter-spacing:var(--ls-wider);white-space:nowrap"
          aria-label="Login or sign up">
         Login
       </a>`;

  const wishBadge = wishlistCount > 0
    ? `<span class="badge-count">${wishlistCount > 9 ? '9+' : wishlistCount}</span>` : '';
  const cartBadge = cartCount > 0
    ? `<span class="badge-count">${cartCount > 9 ? '9+' : cartCount}</span>` : '';

  return `
<header class="site-header" id="site-header">
  <div class="header-inner">
    <!-- Logo -->
    <a href="index.html" class="site-logo">VOID<span>WEAR</span></a>

    <!-- Desktop Nav -->
    <nav class="site-nav" aria-label="Main navigation">
      <a href="index.html" data-nav="index">Home</a>
      <a href="shop.html" data-nav="shop">Shop</a>
      <a href="shop.html?category=hoodies" data-nav="hoodies">Hoodies</a>
      <a href="shop.html?category=tees" data-nav="tees">Tees</a>
      <a href="shop.html?category=footwear" data-nav="footwear">Footwear</a>
      <a href="shop.html?badge=new" data-nav="drops" style="color:var(--clr-accent)">New Drops</a>
    </nav>

    <!-- Search -->
    <div class="header-search" id="header-search-wrap">
      <span class="search-icon">${ICONS.search}</span>
      <input
        type="search"
        id="header-search-input"
        placeholder="Search drops..."
        autocomplete="off"
        aria-label="Search products"
        aria-owns="search-results-dropdown"
        aria-autocomplete="list"
      />
      <div class="search-results-dropdown" id="search-results-dropdown" role="listbox"></div>
    </div>

    <!-- Actions -->
    <div class="header-actions">
      <a href="wishlist.html" title="Wishlist" aria-label="Wishlist">
        ${ICONS.heart}${wishBadge}
      </a>
      <a href="cart.html" title="Cart" aria-label="Cart">
        ${ICONS.cart}${cartBadge}
      </a>
      ${authLink}
    </div>

    <!-- Hamburger -->
    <button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<!-- Mobile Nav -->
<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
  <a href="index.html">Home</a>
  <a href="shop.html">Shop All</a>
  <a href="shop.html?category=hoodies">Hoodies</a>
  <a href="shop.html?category=tees">Tees</a>
  <a href="shop.html?category=bottoms">Bottoms</a>
  <a href="shop.html?category=accessories">Accessories</a>
  <a href="shop.html?category=footwear">Footwear</a>
  <a href="shop.html?badge=new" style="color:var(--clr-accent)">New Drops ↗</a>
  <a href="wishlist.html">Wishlist ${wishlistCount > 0 ? `(${wishlistCount})` : ''}</a>
  <a href="cart.html">Cart ${cartCount > 0 ? `(${cartCount})` : ''}</a>
  ${user
    ? `<a href="account.html">My Account</a>`
    : `<a href="login.html">Login / Sign Up</a>`
  }

  <!-- Mobile search -->
  <div class="mobile-search">
    <span class="search-icon">${ICONS.search}</span>
    <input
      type="search"
      id="mobile-search-input"
      placeholder="Search drops..."
      autocomplete="off"
      aria-label="Search products"
    />
  </div>
</nav>`;
}

// ── Inject & wire up ──────────────────────────────────────────
export function initHeader() {
  const cartCount     = getCartCountSync();
  const wishlistCount = getWishlistCountSync();
  const user          = getCurrentUserSync();

  // Inject HTML before the <main> tag
  const placeholder = document.getElementById('header-placeholder');
  if (placeholder) {
    placeholder.outerHTML = buildHeaderHTML(cartCount, wishlistCount, user);
  } else {
    document.body.insertAdjacentHTML('afterbegin', buildHeaderHTML(cartCount, wishlistCount, user));
  }

  // Highlight active nav link
  _setActiveNav();

  // Wire hamburger
  _initHamburger();

  // Wire search
  _initSearch();
}

// ── Active nav ────────────────────────────────────────────────
function _setActiveNav() {
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === page) a.classList.add('active');
  });
}

// ── Hamburger ─────────────────────────────────────────────────
function _initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on nav link click
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// ── Search ────────────────────────────────────────────────────
let _searchTimer = null;

function _initSearch() {
  _wireSearchInput(
    document.getElementById('header-search-input'),
    document.getElementById('search-results-dropdown')
  );
  _wireMobileSearch(document.getElementById('mobile-search-input'));
}

function _wireSearchInput(input, dropdown) {
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    const q = input.value.trim();
    if (!q) { _hideDropdown(dropdown); return; }
    _searchTimer = setTimeout(() => _runSearch(q, dropdown), 220);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) _showDropdown(dropdown);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('#header-search-wrap')) {
      _hideDropdown(dropdown);
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { _hideDropdown(dropdown); input.blur(); }
  });
}

function _wireMobileSearch(input) {
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      location.href = `shop.html?search=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

async function _runSearch(query, dropdown) {
  // Show loading state
  dropdown.innerHTML = `<div class="search-no-results">Searching…</div>`;
  _showDropdown(dropdown);

  try {
    const results = await searchProducts(query, 7);
    if (!results.length) {
      dropdown.innerHTML = `<div class="search-no-results">No results for "${query}"</div>`;
      return;
    }
    dropdown.innerHTML = results.map(r => `
      <a href="product.html?id=${r.id}" class="search-result-item">
        <img src="${r.image}" alt="${r.name}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/40x40/1a1a1a/666?text=?'">
        <div class="result-info">
          <div class="result-name">${_highlight(r.name, query)}</div>
          <div class="result-price">$${r.price}</div>
        </div>
      </a>
    `).join('');
    // "View all results" link
    dropdown.insertAdjacentHTML('beforeend', `
      <a href="shop.html?search=${encodeURIComponent(query)}" class="search-result-item"
         style="justify-content:center;color:var(--clr-accent);font-size:var(--fs-xs);
                letter-spacing:var(--ls-wider);text-transform:uppercase;font-weight:700;">
        View all results →
      </a>
    `);
  } catch {
    dropdown.innerHTML = `<div class="search-no-results">Search unavailable</div>`;
  }
}

function _showDropdown(el) { el.classList.add('visible'); }
function _hideDropdown(el) { el.classList.remove('visible'); }

function _highlight(text, query) {
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark style="background:var(--clr-accent);color:#000;border-radius:2px;padding:0 2px;">$1</mark>');
}

// ── Badge update (called after cart/wishlist changes) ─────────
export function updateHeaderBadges() {
  const cartBadges = document.querySelectorAll('#site-header .header-actions a[href="cart.html"] .badge-count');
  const wishBadges = document.querySelectorAll('#site-header .header-actions a[href="wishlist.html"] .badge-count');

  const cartCount     = getCartCountSync();
  const wishlistCount = getWishlistCountSync();

  // Update cart badge
  const cartLink = document.querySelector('#site-header .header-actions a[href="cart.html"]');
  if (cartLink) {
    const existing = cartLink.querySelector('.badge-count');
    if (cartCount > 0) {
      const label = cartCount > 9 ? '9+' : cartCount;
      if (existing) existing.textContent = label;
      else cartLink.insertAdjacentHTML('beforeend', `<span class="badge-count">${label}</span>`);
    } else {
      existing?.remove();
    }
  }

  // Update wishlist badge
  const wishLink = document.querySelector('#site-header .header-actions a[href="wishlist.html"]');
  if (wishLink) {
    const existing = wishLink.querySelector('.badge-count');
    if (wishlistCount > 0) {
      const label = wishlistCount > 9 ? '9+' : wishlistCount;
      if (existing) existing.textContent = label;
      else wishLink.insertAdjacentHTML('beforeend', `<span class="badge-count">${label}</span>`);
    } else {
      existing?.remove();
    }
  }
}
