/**
 * /js/components/productCard.js
 * ─────────────────────────────────────────────────────────────
 * Reusable product card renderer.
 * Returns an HTML string or a DOM element.
 * Used on Home, Shop, Wishlist, and Account pages.
 * ─────────────────────────────────────────────────────────────
 */

import { isInWishlist } from '../services/wishlistService.js';

const BADGE_MAP = {
  'new':      { cls: 'badge-new',      label: 'New Drop' },
  'limited':  { cls: 'badge-limited',  label: 'Limited'  },
  'sold-out': { cls: 'badge-sold-out', label: 'Sold Out' },
  'sale':     { cls: 'badge-sale',     label: 'Sale'     },
};

/**
 * Render a product card as an HTML string.
 * @param {object} product
 * @param {{ showQuickAdd?: boolean, compact?: boolean }} [opts={}]
 * @returns {string} HTML
 */
export function renderProductCard(product, opts = {}) {
  const { showQuickAdd = true } = opts;
  const isSoldOut   = product.stock === 0 || product.badge === 'sold-out';
  const wishlisted  = isInWishlist(product.id);
  const badge       = BADGE_MAP[product.badge];

  const badges = badge
    ? `<div class="product-card__badges">
         <span class="badge ${badge.cls}">${badge.label}</span>
       </div>`
    : '';

  const stockWarn = product.stock > 0 && product.stock <= 5
    ? `<div style="font-size:var(--fs-xs);color:var(--clr-red);
                   letter-spacing:var(--ls-wide);text-transform:uppercase;
                   margin-top:var(--sp-1);">
         Only ${product.stock} left
       </div>`
    : '';

  const colorDots = product.colors.slice(0, 4).map(c =>
    `<span class="color-swatch" style="background:${c.hex}" title="${c.name}"></span>`
  ).join('');
  const moreColors = product.colors.length > 4
    ? `<span style="font-size:10px;color:var(--clr-text-3)">+${product.colors.length - 4}</span>`
    : '';

  const priceHTML = product.originalPrice
    ? `<span class="product-card__price">$${product.price}</span>
       <span class="product-card__price-original">$${product.originalPrice}</span>`
    : `<span class="product-card__price">${isSoldOut ? '<span style="color:var(--clr-text-3)">$' + product.price + '</span>' : '$' + product.price}</span>`;

  const quickAdd = showQuickAdd && !isSoldOut
    ? `<button class="product-card__quick-add" data-product-id="${product.id}">+ Add</button>`
    : '';

  return `
<article class="product-card${isSoldOut ? ' sold-out' : ''}"
         data-product-id="${product.id}"
         role="article">
  <a href="product.html?id=${product.id}" class="product-card__img-wrap" tabindex="-1" aria-hidden="true">
    ${badges}
    <img
      src="${product.images[0]}"
      alt="${product.name}"
      loading="lazy"
      onerror="this.src='https://via.placeholder.com/400x533/1a1a1a/444?text=VOIDWEAR'"
    />
    <button
      class="product-card__wishlist${wishlisted ? ' active' : ''}"
      data-wishlist-id="${product.id}"
      aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
      title="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           fill="${wishlisted ? 'currentColor' : 'none'}"
           stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78
                 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  </a>

  <div class="product-card__body">
    <div class="product-card__category">${product.category}</div>
    <a href="product.html?id=${product.id}">
      <h3 class="product-card__name">${product.name}</h3>
    </a>
    ${stockWarn}
    <div class="product-card__colors">
      ${colorDots}${moreColors}
    </div>
    <div class="product-card__footer">
      <div style="display:flex;align-items:center;gap:var(--sp-2)">
        ${priceHTML}
      </div>
      ${quickAdd}
    </div>
  </div>
</article>`;
}

/**
 * Render a grid of product cards into a container element.
 * Wires wishlist toggle and quick-add buttons automatically.
 * @param {HTMLElement} container
 * @param {object[]} products
 * @param {object} [opts]
 */
export function renderProductGrid(container, products, opts = {}) {
  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">◈</div>
        <h3>No Products Found</h3>
        <p>Try adjusting your filters or browse all drops.</p>
        <a href="shop.html" class="btn btn-secondary mt-4">Browse All</a>
      </div>`;
    return;
  }
  container.innerHTML = products.map(p => renderProductCard(p, opts)).join('');
}

/**
 * Render skeleton loading cards.
 * @param {HTMLElement} container
 * @param {number} [count=6]
 */
export function renderSkeletons(container, count = 6) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line w-1-2"></div>
        <div class="skeleton skeleton-line w-3-4 h-6"></div>
        <div class="skeleton skeleton-line w-1-4"></div>
        <div class="skeleton skeleton-line w-1-2"></div>
      </div>
    </div>`).join('');
}
