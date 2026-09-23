/**
 * /js/utils/devSeed.js
 * ─────────────────────────────────────────────────────────────
 * Development / demo seed helper.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  Set DEV_SEED = false before shipping to production.    │
 * └─────────────────────────────────────────────────────────┘
 *
 * When DEV_SEED is true, calling runDevSeed() on the homepage
 * will (each once, per localStorage flag):
 *
 *   1. CART   — pre-populate with 3 real items so cart.html /
 *               checkout.html are immediately testable.
 *               Flag: voidwear_demo_cart_seeded
 *
 *   2. WISHLIST — pre-populate with 3 items covering a normal
 *               product, a sale product (originalPrice), and a
 *               sold-out product, so wishlist.html shows all
 *               UI states immediately.
 *               Flag: voidwear_demo_wishlist_seeded
 *
 *   3. AUTH   — auto-login as the built-in demo user
 *               (demo@voidwear.com / demo1234 / Alex Void)
 *               so account.html and order history work without
 *               manually logging in.
 *               Flag: voidwear_demo_auth_seeded
 *
 * Each flag is independent — clearing one (or all) via
 * localStorage in DevTools re-seeds just that slice on the
 * next homepage load.
 *
 * None of this touches the service-layer function signatures.
 * ─────────────────────────────────────────────────────────────
 */

import { getItem, setItem, KEYS } from './storage.js';
import { login, isLoggedIn } from '../services/authService.js';

// ── Master switch ─────────────────────────────────────────────
/**
 * Flip to `false` before going to production.
 * @type {boolean}
 */
export const DEV_SEED = true;

// ── Per-slice "already seeded" flag keys ──────────────────────
// These are stored WITHOUT the storage.js prefix because they are
// dev-only meta-flags, not application data.  We write them via
// the raw localStorage API so they don't clutter the app's
// voidwear_ namespace, and they can be cleared individually via
// DevTools → Application → Local Storage.
const FLAG_CART     = 'voidwear_demo_cart_seeded';
const FLAG_WISHLIST = 'voidwear_demo_wishlist_seeded';
const FLAG_AUTH     = 'voidwear_demo_auth_seeded';

// ── Seed data ─────────────────────────────────────────────────

/**
 * Three cart items covering a tee, a hoodie, and an accessory —
 * enough to hit the free-shipping threshold ($212 subtotal > $100)
 * and give checkout.html a realistic order to work with.
 *
 * Shape must match cartService's CartItem:
 *   cartItemId, productId, name, brand, image,
 *   color, size, price, quantity, stock
 */
const SEED_CART = [
  {
    cartItemId: 'void-logo-tee__Black__L',
    productId:  'void-logo-tee',
    name:       'VOID LOGO HEAVYWEIGHT TEE',
    brand:      'VOIDWEAR',
    image:      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80',
    color:      'Black',
    size:       'L',
    price:      55,
    quantity:   2,
    stock:      80,
  },
  {
    cartItemId: 'blk-arch-hoodie__Black__M',
    productId:  'blk-arch-hoodie',
    name:       'ARCH LOGO HOODIE',
    brand:      'VOIDWEAR',
    image:      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=200&q=80',
    color:      'Black',
    size:       'M',
    price:      119,
    quantity:   1,
    stock:      14,
  },
  {
    cartItemId: 'void-beanie__Neon__ONE SIZE',
    productId:  'void-beanie',
    name:       'VOID RIBBED BEANIE',
    brand:      'VOIDWEAR',
    image:      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=200&q=80',
    color:      'Neon',
    size:       'ONE SIZE',
    price:      38,
    quantity:   1,
    stock:      62,
  },
];

/**
 * Three wishlist items chosen to exercise all UI states:
 *   1. void-nylon-track   — has originalPrice → sale / strikethrough UI
 *   2. cargo-tech-pant    — normal in-stock product
 *   3. blackout-moto-jacket — stock: 0 → sold-out state on wishlist card
 *
 * Shape must match wishlistService's WishlistItem:
 *   productId, name, brand, category, price,
 *   image, badge, stock, addedAt
 */
const SEED_WISHLIST = [
  {
    productId: 'void-nylon-track',
    name:      'NYLON TRACK JACKET',
    brand:     'VOIDWEAR',
    category:  'hoodies',
    price:     89,
    image:     'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    badge:     'sale',
    stock:     19,
    addedAt:   '2026-09-20T10:00:00Z',
  },
  {
    productId: 'cargo-tech-pant',
    name:      'TECH CARGO PANTS',
    brand:     'VOIDWEAR',
    category:  'bottoms',
    price:     185,
    image:     'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
    badge:     'new',
    stock:     28,
    addedAt:   '2026-09-21T08:30:00Z',
  },
  {
    productId: 'blackout-moto-jacket',
    name:      'BLACKOUT MOTO JACKET',
    brand:     'VOIDWEAR',
    category:  'hoodies',
    price:     295,
    image:     'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
    badge:     'sold-out',
    stock:     0,
    addedAt:   '2026-09-22T14:15:00Z',
  },
];

// ── Slice seeders ─────────────────────────────────────────────

/**
 * Seed the cart exactly once.
 * No-ops if the cart already has items OR the seed flag is set.
 */
function seedCart() {
  // Don't overwrite items the user may have added themselves
  const existing = getItem(KEYS.CART, []);
  if (existing.length > 0) return;
  if (localStorage.getItem(FLAG_CART)) return;

  setItem(KEYS.CART, SEED_CART);
  localStorage.setItem(FLAG_CART, '1');
  console.debug('[devSeed] cart seeded with', SEED_CART.length, 'items');
}

/**
 * Seed the wishlist exactly once.
 * No-ops if the wishlist already has items OR the seed flag is set.
 */
function seedWishlist() {
  const existing = getItem(KEYS.WISHLIST, []);
  if (existing.length > 0) return;
  if (localStorage.getItem(FLAG_WISHLIST)) return;

  setItem(KEYS.WISHLIST, SEED_WISHLIST);
  localStorage.setItem(FLAG_WISHLIST, '1');
  console.debug('[devSeed] wishlist seeded with', SEED_WISHLIST.length, 'items');
}

/**
 * Auto-login as the demo user exactly once per session.
 *
 * Uses authService.login() so the full auth flow runs (registry
 * seed, sanitizeUser, KEYS.AUTH_USER write) — no shortcuts.
 *
 * No-ops if:
 *   - A user is already logged in (don't clobber a real session)
 *   - The auth seed flag is already set
 *
 * @returns {Promise<void>}
 */
async function seedAuth() {
  if (isLoggedIn()) return;
  if (localStorage.getItem(FLAG_AUTH)) return;

  try {
    await login('demo@voidwear.com', 'demo1234');
    localStorage.setItem(FLAG_AUTH, '1');
    console.debug('[devSeed] auto-logged in as demo@voidwear.com (Alex Void)');
  } catch (err) {
    // Don't break the page if the demo user isn't found
    console.warn('[devSeed] auto-login failed:', err.message);
  }
}

// ── Public entry point ────────────────────────────────────────

/**
 * Run all dev seeds. Call once from home.js on page load.
 * Respects the DEV_SEED master switch — safe to leave in
 * production code as long as DEV_SEED is false.
 *
 * Returns a Promise so the caller can await it if it needs the
 * auth state to be settled before rendering (e.g. hiding the
 * hero login button).
 *
 * @returns {Promise<void>}
 */
export async function runDevSeed() {
  if (!DEV_SEED) return;

  // Cart and wishlist are synchronous writes — run first so
  // header badges and page state are correct immediately.
  seedCart();
  seedWishlist();

  // Auth is async (authService has a fake delay) — await it so
  // the header can reflect the logged-in state straight away.
  await seedAuth();
}
