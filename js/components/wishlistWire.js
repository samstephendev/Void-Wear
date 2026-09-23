/**
 * /js/components/wishlistWire.js
 * ─────────────────────────────────────────────────────────────
 * Attaches wishlist toggle behaviour to product card grids.
 * Call wireWishlistButtons(container) after rendering cards.
 * Uses event delegation so it works even after re-renders.
 * ─────────────────────────────────────────────────────────────
 */

import { toggleWishlist } from '../services/wishlistService.js';
import { getProductById } from '../services/productService.js';
import { updateHeaderBadges } from './header.js';
import { showToast } from './toast.js';

/**
 * Wire wishlist toggle buttons inside a container via delegation.
 * @param {HTMLElement} container
 */
export function wireWishlistButtons(container) {
  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-wishlist-id]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const productId = btn.dataset.wishlistId;
    const product   = await getProductById(productId);
    if (!product) return;

    try {
      const { added } = await toggleWishlist(product);
      btn.classList.toggle('active', added);
      btn.setAttribute('aria-label', added ? 'Remove from wishlist' : 'Add to wishlist');

      // Update heart fill
      const path = btn.querySelector('svg');
      if (path) path.setAttribute('fill', added ? 'currentColor' : 'none');

      updateHeaderBadges();
      showToast(
        added ? 'Added to Wishlist' : 'Removed from Wishlist',
        product.name
      );
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  });
}
