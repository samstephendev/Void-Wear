/**
 * /js/services/productService.js
 * ─────────────────────────────────────────────────────────────
 * All product data access goes through this file.
 * Page code NEVER imports from /js/data/products.js directly.
 *
 * BACKEND SWAP: Replace the bodies of these functions with
 * fetch() calls to your REST/GraphQL API. The function
 * signatures, return types, and Promise-based interface stay
 * identical — no page code changes required.
 *
 * Example swap for getProducts():
 *   export async function getProducts(filters = {}) {
 *     const params = new URLSearchParams(filters);
 *     const res = await fetch(`/api/products?${params}`);
 *     if (!res.ok) throw new Error('Failed to fetch products');
 *     return res.json();
 *   }
 * ─────────────────────────────────────────────────────────────
 */

import { PRODUCTS, CATEGORIES, FEATURED_DROP } from '../data/products.js';

/** Simulated network delay (ms) — remove when using real API */
const FAKE_DELAY = 400;
const delay = (ms = FAKE_DELAY) => new Promise(r => setTimeout(r, ms));

// ── Reviews mock (keyed by productId) ────────────────────────
const MOCK_REVIEWS = {
  'void-logo-tee': [
    { id: 'r1', author: 'Marcus T.', avatar: 'MT', rating: 5, date: '2026-09-01', body: 'Absolute staple. The weight is perfect — not flimsy at all. Runs slightly large which is what I wanted for that boxy fit.' },
    { id: 'r2', author: 'Jade K.',   avatar: 'JK', rating: 5, date: '2026-08-28', body: 'Best heavyweight tee I\'ve ever owned. Colour stays black even after 20 washes.' },
    { id: 'r3', author: 'Devon R.',  avatar: 'DR', rating: 4, date: '2026-08-20', body: 'Great quality. Sizing is generous — I\'m usually a M and got a M. Perfect oversized fit.' },
    { id: 'r4', author: 'Priya S.',  avatar: 'PS', rating: 5, date: '2026-08-15', body: 'The puff print is incredible in person. Photos don\'t do it justice.' },
  ],
  'blk-arch-hoodie': [
    { id: 'r5', author: 'Sam W.',    avatar: 'SW', rating: 5, date: '2026-09-05', body: 'The heaviest hoodie I\'ve ever worn. Like wearing a blanket. Worth every penny.' },
    { id: 'r6', author: 'Leo B.',    avatar: 'LB', rating: 5, date: '2026-09-02', body: 'Fit is perfect, quality is insane. This brand is the real deal.' },
    { id: 'r7', author: 'Nadia F.',  avatar: 'NF', rating: 4, date: '2026-08-25', body: 'Love the oversized fit. Hood is super thick. Only gripe is shipping took a week.' },
  ],
  'cargo-tech-pant': [
    { id: 'r8',  author: 'Chris M.', avatar: 'CM', rating: 5, date: '2026-09-10', body: 'These pants are insane. The ripstop fabric is incredibly durable and the fit is perfect.' },
    { id: 'r9',  author: 'Taylor J.',avatar: 'TJ', rating: 4, date: '2026-09-06', body: 'Great build quality. The articulated knees make movement really comfortable.' },
    { id: 'r10', author: 'Alex V.',  avatar: 'AV', rating: 5, date: '2026-09-01', body: 'I live in these. Multiple pockets, comfortable, and they look incredible styled up or down.' },
  ],
  'void-runner': [
    { id: 'r11', author: 'Jordan L.', avatar: 'JL', rating: 5, date: '2026-09-13', body: 'Best shoes I\'ve copped this year. The triple black colourway is immaculate.' },
    { id: 'r12', author: 'Kai S.',    avatar: 'KS', rating: 5, date: '2026-09-12', body: 'Incredibly comfortable from the first wear. No break-in needed.' },
    { id: 'r13', author: 'Mia T.',    avatar: 'MT', rating: 4, date: '2026-09-10', body: 'The mesh upper breathes really well. Sizing is true to size.' },
  ],
};

// ── Public API ────────────────────────────────────────────────

/**
 * Fetch all products, with optional filtering and sorting.
 * @param {{ category?:string, sizes?:string[], colors?:string[], maxPrice?:number, badge?:string, sort?:string, search?:string }} [filters={}]
 * @returns {Promise<object[]>}
 */
export async function getProducts(filters = {}) {
  await delay();
  let results = [...PRODUCTS];

  const { category, sizes, colors, maxPrice, badge, sort, search } = filters;

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  if (sizes && sizes.length > 0) {
    results = results.filter(p => sizes.some(s => p.sizes.includes(s)));
  }
  if (colors && colors.length > 0) {
    results = results.filter(p =>
      colors.some(c => p.colors.some(pc => pc.name.toLowerCase() === c.toLowerCase()))
    );
  }
  if (maxPrice != null) {
    results = results.filter(p => p.price <= maxPrice);
  }
  if (badge) {
    results = results.filter(p => p.badge === badge);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.brand.toLowerCase().includes(q)
    );
  }

  // Sorting
  switch (sort) {
    case 'price-asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'popularity':
      results.sort((a, b) => b.popularity - a.popularity);
      break;
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    default:
      // default: featured first, then by popularity
      results.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.popularity - a.popularity;
      });
  }

  return results;
}

/**
 * Fetch a single product by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getProductById(id) {
  await delay(250);
  return PRODUCTS.find(p => p.id === id) ?? null;
}

/**
 * Fetch featured products for the homepage.
 * @param {number} [limit=6]
 * @returns {Promise<object[]>}
 */
export async function getFeaturedProducts(limit = 6) {
  await delay(350);
  return PRODUCTS
    .filter(p => p.isFeatured && p.stock > 0)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Fetch new-drop products.
 * @param {number} [limit=4]
 * @returns {Promise<object[]>}
 */
export async function getNewDrops(limit = 4) {
  await delay(300);
  return PRODUCTS
    .filter(p => p.isNew)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

/**
 * Live search — fast, no delay, returns lightweight result objects.
 * @param {string} query
 * @param {number} [limit=8]
 * @returns {Promise<{ id, name, category, price, image }[]>}
 */
export async function searchProducts(query, limit = 8) {
  // No delay for live search — feels instant
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return PRODUCTS
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.brand.toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(p => ({
      id:       p.id,
      name:     p.name,
      category: p.category,
      price:    p.price,
      badge:    p.badge,
      image:    p.images[0],
    }));
}

/**
 * Fetch all available categories.
 * @returns {Promise<{ id, label, icon }[]>}
 */
export async function getCategories() {
  await delay(100);
  return CATEGORIES;
}

/**
 * Fetch the featured drop data for the countdown section.
 * @returns {Promise<object>}
 */
export async function getFeaturedDrop() {
  await delay(200);
  return FEATURED_DROP;
}

/**
 * Fetch reviews for a product.
 * @param {string} productId
 * @returns {Promise<object[]>}
 */
export async function getReviews(productId) {
  await delay(300);
  return MOCK_REVIEWS[productId] ?? [];
}

/**
 * Get the min and max price across all products.
 * @returns {Promise<{ min: number, max: number }>}
 */
export async function getPriceRange() {
  await delay(100);
  const prices = PRODUCTS.map(p => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Get all unique sizes across all products (or within a category).
 * @param {string} [category]
 * @returns {Promise<string[]>}
 */
export async function getAllSizes(category) {
  await delay(100);
  const pool = category && category !== 'all'
    ? PRODUCTS.filter(p => p.category === category)
    : PRODUCTS;
  const set = new Set(pool.flatMap(p => p.sizes));
  const order = ['XS','S','M','L','XL','XXL','3XL','28','30','32','34','36','6','7','8','9','10','11','12','13','ONE SIZE'];
  return order.filter(s => set.has(s));
}

/**
 * Get all unique colors across all products.
 * @returns {Promise<{ name, hex }[]>}
 */
export async function getAllColors() {
  await delay(100);
  const map = new Map();
  PRODUCTS.forEach(p => p.colors.forEach(c => map.set(c.name, c)));
  return [...map.values()];
}
