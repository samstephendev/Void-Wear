/**
 * /js/services/wishlistService.js
 * ─────────────────────────────────────────────────────────────
 * Wishlist operations — backed by localStorage.
 *
 * BACKEND SWAP: Replace function bodies with API calls:
 *   getWishlist()       → GET    /wishlist
 *   addToWishlist(id)   → POST   /wishlist/items
 *   removeFromWishlist(id) → DELETE /wishlist/items/:id
 *   isInWishlist(id)    → derived from GET /wishlist
 *
 * Wishlist items are stored as full product snapshots so the
 * wishlist page renders without a second product lookup.
 *
 * WishlistItem shape:
 * {
 *   productId : string
 *   name      : string
 *   brand     : string
 *   category  : string
 *   price     : number
 *   image     : string
 *   badge     : string|null
 *   stock     : number
 *   addedAt   : string  ← ISO date
 * }
 * ─────────────────────────────────────────────────────────────
 */

import { getItem, setItem, KEYS } from '../utils/storage.js';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

function readWishlist() {
  return getItem(KEYS.WISHLIST, []);
}

function writeWishlist(items) {
  setItem(KEYS.WISHLIST, items);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get all wishlist items.
 * @returns {Promise<object[]>}
 */
export async function getWishlist() {
  await delay(150);
  return readWishlist();
}

/**
 * Add a product to the wishlist (no-op if already present).
 * @param {object} product — full product object from productService
 * @returns {Promise<object[]>} updated wishlist
 */
export async function addToWishlist(product) {
  await delay();
  const list = readWishlist();
  const already = list.some(i => i.productId === product.id);
  if (!already) {
    list.push({
      productId: product.id,
      name:      product.name,
      brand:     product.brand,
      category:  product.category,
      price:     product.price,
      image:     product.images[0],
      badge:     product.badge,
      stock:     product.stock,
      addedAt:   new Date().toISOString(),
    });
    writeWishlist(list);
  }
  return list;
}

/**
 * Remove a product from the wishlist.
 * @param {string} productId
 * @returns {Promise<object[]>} updated wishlist
 */
export async function removeFromWishlist(productId) {
  await delay();
  const list = readWishlist().filter(i => i.productId !== productId);
  writeWishlist(list);
  return list;
}

/**
 * Toggle wishlist membership — add if absent, remove if present.
 * @param {object} product
 * @returns {Promise<{ list: object[], added: boolean }>}
 */
export async function toggleWishlist(product) {
  await delay();
  const list = readWishlist();
  const idx  = list.findIndex(i => i.productId === product.id);
  if (idx > -1) {
    list.splice(idx, 1);
    writeWishlist(list);
    return { list, added: false };
  } else {
    list.push({
      productId: product.id,
      name:      product.name,
      brand:     product.brand,
      category:  product.category,
      price:     product.price,
      image:     product.images[0],
      badge:     product.badge,
      stock:     product.stock,
      addedAt:   new Date().toISOString(),
    });
    writeWishlist(list);
    return { list, added: true };
  }
}

/**
 * Check if a product is in the wishlist (synchronous).
 * @param {string} productId
 * @returns {boolean}
 */
export function isInWishlist(productId) {
  return readWishlist().some(i => i.productId === productId);
}

/**
 * Get wishlist count (synchronous — used for header badge).
 * @returns {number}
 */
export function getWishlistCountSync() {
  return readWishlist().length;
}
