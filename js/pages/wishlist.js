/**
 * /js/pages/wishlist.js
 * Wishlist page — render saved items, remove, move to cart (individual + all).
 */

import { initHeader, updateHeaderBadges } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { getWishlist, removeFromWishlist } from '../services/wishlistService.js';
import { addToCart } from '../services/cartService.js';
import { getProductById } from '../services/productService.js';

initHeader();
initFooter();

// ── State ─────────────────────────────────────────────────────
let wishlistItems = [];

// ── Boot ──────────────────────────────────────────────────────
(async function init() {
  wishlistItems = await getWishlist();
  hide('wl-loading');

  if (!wishlistItems.length) {
    show('wl-empty');
  } else {
    show('wl-content');
    renderItems();
  }
})();

// ── Render ────────────────────────────────────────────────────
function renderItems() {
  const container = document.getElementById('wl-items');
  if (!container) return;

  // Update count
  const countEl = document.getElementById('wl-count');
  if (countEl) countEl.textContent = wishlistItems.length;

  if (!wishlistItems.length) {
    hide('wl-content');
    show('wl-empty');
    return;
  }

  container.innerHTML = wishlistItems.map(item => {
    const isSoldOut = item.stock === 0;
    const addedDate = new Date(item.addedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    const addBtn = isSoldOut
      ? `<span class="wl-stock-out">Sold Out</span>`
      : `<button class="btn btn-primary btn-sm move-to-cart-btn"
                 data-product-id="${item.productId}">
           + Add to Cart
         </button>`;

    const badge = item.badge && item.badge !== 'sold-out'
      ? `<span class="badge badge-${item.badge}" style="margin-bottom:var(--sp-2)">
           ${{ new: 'New Drop', limited: 'Limited', sale: 'Sale' }[item.badge] || item.badge}
         </span>`
      : '';

    return `
      <div class="wishlist-item" data-product-id="${item.productId}">

        <!-- Thumbnail -->
        <a href="product.html?id=${item.productId}" tabindex="-1" aria-hidden="true">
          <img src="${item.image}"
               alt="${item.name}"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/88x108/1a1a1a/444?text=?'" />
        </a>

        <!-- Info -->
        <div>
          ${badge}
          <a class="wishlist-item-name" href="product.html?id=${item.productId}">
            ${item.name}
          </a>
          <div class="wishlist-item-meta">${item.category}</div>
          <div class="wishlist-item-price">₹${item.price}</div>
          <div class="wishlist-item-actions">
            ${addBtn}
            <button class="wishlist-remove-btn"
                    data-product-id="${item.productId}"
                    aria-label="Remove ${item.name} from wishlist">
              Remove
            </button>
          </div>
        </div>

        <!-- Right: date saved -->
        <div class="wishlist-item-right">
          <span class="wishlist-item-added">Saved ${addedDate}</span>
          <a href="product.html?id=${item.productId}"
             class="btn btn-ghost btn-sm"
             style="font-size:var(--fs-xs)">
            View →
          </a>
        </div>

      </div>`;
  }).join('');

  wireButtons(container);
}

// ── Wire item buttons ─────────────────────────────────────────
function wireButtons(container) {
  // Move single item to cart
  container.addEventListener('click', async e => {
    const addBtn    = e.target.closest('.move-to-cart-btn');
    const removeBtn = e.target.closest('.wishlist-remove-btn');

    if (addBtn) {
      const productId = addBtn.dataset.productId;
      await handleMoveToCart(productId, addBtn);
    }

    if (removeBtn) {
      const productId = removeBtn.dataset.productId;
      await handleRemove(productId);
    }
  });
}

// ── Move single item to cart ──────────────────────────────────
async function handleMoveToCart(productId, btn) {
  if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }

  try {
    // Fetch full product to get color/size defaults
    const product = await getProductById(productId);
    if (!product || product.stock === 0) {
      showToast('Sold Out', 'This item is no longer available.', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '+ Add to Cart'; }
      return;
    }

    await addToCart({
      productId: product.id,
      name:      product.name,
      brand:     product.brand,
      image:     product.images[0],
      color:     product.colors[0]?.name ?? 'Default',
      size:      product.sizes[0]  ?? 'ONE SIZE',
      price:     product.price,
      stock:     product.stock,
    }, 1);

    updateHeaderBadges();
    showToast('Added to Cart', product.name);

    // Remove from wishlist after moving
    wishlistItems = await removeFromWishlist(productId);
    updateHeaderBadges();
    renderItems();
  } catch (err) {
    showToast('Error', err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = '+ Add to Cart'; }
  }
}

// ── Remove single item ────────────────────────────────────────
async function handleRemove(productId) {
  const item = wishlistItems.find(i => i.productId === productId);
  wishlistItems = await removeFromWishlist(productId);
  updateHeaderBadges();
  showToast('Removed', item?.name ?? '');
  renderItems();
}

// ── Clear all ─────────────────────────────────────────────────
document.getElementById('clear-wishlist-btn')?.addEventListener('click', async () => {
  if (!confirm('Remove all items from your wishlist?')) return;
  // Remove each item sequentially
  for (const item of [...wishlistItems]) {
    await removeFromWishlist(item.productId);
  }
  wishlistItems = [];
  updateHeaderBadges();
  hide('wl-content');
  show('wl-empty');
  showToast('Wishlist cleared');
});

// ── Move ALL to cart ──────────────────────────────────────────
document.getElementById('move-all-to-cart-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('move-all-to-cart-btn');
  btn.disabled = true;
  btn.textContent = 'Adding…';

  let added = 0;
  let failed = 0;

  for (const item of [...wishlistItems]) {
    try {
      const product = await getProductById(item.productId);
      if (!product || product.stock === 0) { failed++; continue; }

      await addToCart({
        productId: product.id,
        name:      product.name,
        brand:     product.brand,
        image:     product.images[0],
        color:     product.colors[0]?.name ?? 'Default',
        size:      product.sizes[0]  ?? 'ONE SIZE',
        price:     product.price,
        stock:     product.stock,
      }, 1);

      wishlistItems = await removeFromWishlist(item.productId);
      added++;
    } catch {
      failed++;
    }
  }

  updateHeaderBadges();

  if (added > 0) {
    showToast('Moved to Cart', `${added} item${added !== 1 ? 's' : ''} added.`);
  }
  if (failed > 0) {
    showToast('Some Items Unavailable', `${failed} sold-out item${failed !== 1 ? 's' : ''} skipped.`, 'error');
  }

  renderItems();
  btn.disabled = false;
  btn.textContent = 'Move All to Cart';
});

// ── Helpers ───────────────────────────────────────────────────
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
