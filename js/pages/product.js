/**
 * /js/pages/product.js
 * Product detail — gallery, color/size selector, qty, add to cart, reviews, related.
 */

import { initHeader, updateHeaderBadges } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid, renderSkeletons } from '../components/productCard.js';
import { wireWishlistButtons } from '../components/wishlistWire.js';
import { showToast } from '../components/toast.js';
import { getProductById, getReviews, getProducts } from '../services/productService.js';
import { addToCart } from '../services/cartService.js';
import { toggleWishlist, isInWishlist } from '../services/wishlistService.js';

initHeader();
initFooter();

// ── State ─────────────────────────────────────────────────────
let product     = null;
let selectedColor = null;
let selectedSize  = null;
let quantity      = 1;

// ── Read product ID from URL ───────────────────────────────────
const productId = new URLSearchParams(location.search).get('id');

if (!productId) {
  showError();
} else {
  loadProduct(productId);
}

// ── Load product ──────────────────────────────────────────────
async function loadProduct(id) {
  try {
    product = await getProductById(id);
    if (!product) { showError(); return; }

    document.title = `${product.name} — VOIDWEAR`;
    renderProduct(product);
    loadReviews(id);
    loadRelated(product);
  } catch {
    showError();
  }
}

function showError() {
  hide('product-loading');
  show('product-error');
}

// ── Render product ────────────────────────────────────────────
function renderProduct(p) {
  hide('product-loading');
  show('product-content');
  show('reviews-section');
  show('related-section');

  // Breadcrumb
  document.getElementById('breadcrumb-name').textContent = p.name;

  // Gallery
  renderGallery(p);

  // Brand / Name
  setText('info-brand', p.brand);
  setText('info-name', p.name);

  // Rating
  const stars = document.getElementById('info-stars');
  if (stars) stars.innerHTML = renderStars(p.rating);
  setText('info-rating-score', p.rating.toFixed(1));
  const reviewBtn = document.getElementById('review-scroll-btn');
  if (reviewBtn) {
    reviewBtn.textContent = `${p.reviewCount} reviews`;
    reviewBtn.addEventListener('click', () => {
      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Price
  const priceEl = document.getElementById('info-price');
  if (priceEl) {
    priceEl.innerHTML = p.originalPrice
      ? `₹${p.price}<span class="original">₹${p.originalPrice}</span>`
      : `₹${p.price}`;
  }

  // Stock indicator
  renderStock(p);

  // Colors
  renderColorSelector(p);

  // Sizes
  renderSizeSelector(p);

  // Description + Details
  setText('info-description', p.description);
  const detailsList = document.getElementById('info-details');
  if (detailsList) {
    detailsList.innerHTML = p.details.map(d => `<li>${d}</li>`).join('');
  }

  // Wishlist button
  updateWishlistBtn(isInWishlist(p.id));

  // Wire accordion
  wireAccordion();

  // Wire qty
  wireQtyPicker(p.stock);

  // Wire add to cart / buy now
  wireCartButtons(p);
}

// ── Gallery ───────────────────────────────────────────────────
function renderGallery(p) {
  const mainImg   = document.getElementById('gallery-main-img');
  const thumbs    = document.getElementById('gallery-thumbs');
  const badgesEl  = document.getElementById('gallery-badges');

  if (mainImg) {
    mainImg.src = p.images[0];
    mainImg.alt = p.name;
  }

  if (badgesEl && p.badge) {
    const BADGE_MAP = {
      'new':      ['badge-new',      'New Drop'],
      'limited':  ['badge-limited',  'Limited'],
      'sold-out': ['badge-sold-out', 'Sold Out'],
      'sale':     ['badge-sale',     'Sale'],
    };
    const [cls, label] = BADGE_MAP[p.badge] || [];
    if (cls) badgesEl.innerHTML = `<span class="badge ${cls}">${label}</span>`;
  }

  if (thumbs) {
    thumbs.innerHTML = p.images.map((src, i) => `
      <div class="gallery__thumb${i === 0 ? ' active' : ''}" data-img-idx="${i}">
        <img src="${src}" alt="${p.name} view ${i + 1}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/72x88/1a1a1a/444?text=?'" />
      </div>`).join('');

    thumbs.addEventListener('click', e => {
      const thumb = e.target.closest('.gallery__thumb');
      if (!thumb) return;
      const idx = Number(thumb.dataset.imgIdx);
      if (mainImg) { mainImg.src = p.images[idx]; mainImg.alt = `${p.name} view ${idx + 1}`; }
      thumbs.querySelectorAll('.gallery__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  }
}

// ── Stock indicator ───────────────────────────────────────────
function renderStock(p) {
  const el = document.getElementById('info-stock');
  if (!el) return;
  if (p.stock === 0) {
    el.innerHTML = `<span class="product-info__stock out"><span class="stock-dot"></span>Sold Out</span>`;
  } else if (p.stock <= 5) {
    el.innerHTML = `<span class="product-info__stock low"><span class="stock-dot"></span>Only ${p.stock} left — order fast</span>`;
  } else {
    el.innerHTML = `<span class="product-info__stock ok"><span class="stock-dot"></span>In Stock</span>`;
  }
}

// ── Color selector ────────────────────────────────────────────
function renderColorSelector(p) {
  const el = document.getElementById('color-selector');
  if (!el) return;
  selectedColor = p.colors[0]?.name ?? null;
  setText('selected-color', selectedColor);

  el.innerHTML = p.colors.map((c, i) => `
    <button class="color-btn${i === 0 ? ' active' : ''}"
            data-color="${c.name}"
            style="background:${c.hex}"
            title="${c.name}"
            aria-label="${c.name}"
            aria-pressed="${i === 0}">
    </button>`).join('');

  el.addEventListener('click', e => {
    const btn = e.target.closest('.color-btn');
    if (!btn) return;
    selectedColor = btn.dataset.color;
    setText('selected-color', selectedColor);
    el.querySelectorAll('.color-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.color === selectedColor);
      b.setAttribute('aria-pressed', b.dataset.color === selectedColor);
    });
  });
}

// ── Size selector ─────────────────────────────────────────────
function renderSizeSelector(p) {
  const el = document.getElementById('size-selector');
  if (!el) return;
  selectedSize = null;

  el.innerHTML = p.sizes.map(s => `
    <button class="size-btn" data-size="${s}" aria-label="Size ${s}">${s}</button>`
  ).join('');

  el.addEventListener('click', e => {
    const btn = e.target.closest('.size-btn');
    if (!btn || btn.classList.contains('unavailable')) return;
    selectedSize = btn.dataset.size;
    setText('selected-size', selectedSize);
    clearError('size-error');
    el.querySelectorAll('.size-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.size === selectedSize)
    );
  });
}

// ── Qty picker ────────────────────────────────────────────────
function wireQtyPicker(stock) {
  const dec   = document.getElementById('qty-dec');
  const inc   = document.getElementById('qty-inc');
  const input = document.getElementById('qty-input');
  const max   = Math.max(1, stock);

  dec?.addEventListener('click', () => { if (quantity > 1) { quantity--; input.value = quantity; } });
  inc?.addEventListener('click', () => { if (quantity < max) { quantity++; input.value = quantity; } });
}

// ── Cart buttons ──────────────────────────────────────────────
function wireCartButtons(p) {
  const isSoldOut = p.stock === 0;

  const addBtn = document.getElementById('add-to-cart-btn');
  const buyBtn = document.getElementById('buy-now-btn');

  if (isSoldOut) {
    if (addBtn) { addBtn.textContent = 'Sold Out'; addBtn.disabled = true; }
    if (buyBtn) { buyBtn.disabled = true; }
    return;
  }

  addBtn?.addEventListener('click', async () => {
    if (!validateSelections()) return;
    addBtn.disabled = true;
    addBtn.textContent = 'Adding…';
    try {
      await addToCart({ productId: p.id, name: p.name, brand: p.brand,
        image: p.images[0], color: selectedColor, size: selectedSize,
        price: p.price, stock: p.stock }, quantity);
      updateHeaderBadges();
      showToast('Added to Cart', `${p.name} — ${selectedColor} / ${selectedSize}`);
      addBtn.textContent = '✓ Added!';
      setTimeout(() => { addBtn.textContent = 'Add to Cart'; addBtn.disabled = false; }, 1800);
    } catch (err) {
      showToast('Error', err.message, 'error');
      addBtn.textContent = 'Add to Cart';
      addBtn.disabled = false;
    }
  });

  buyBtn?.addEventListener('click', async () => {
    if (!validateSelections()) return;
    buyBtn.disabled = true;
    try {
      await addToCart({ productId: p.id, name: p.name, brand: p.brand,
        image: p.images[0], color: selectedColor, size: selectedSize,
        price: p.price, stock: p.stock }, quantity);
      updateHeaderBadges();
      location.href = 'checkout.html';
    } catch (err) {
      showToast('Error', err.message, 'error');
      buyBtn.disabled = false;
    }
  });

  // Wishlist button
  const wlBtn = document.getElementById('wishlist-btn');
  wlBtn?.addEventListener('click', async () => {
    const { added } = await toggleWishlist(p);
    updateWishlistBtn(added);
    updateHeaderBadges();
    showToast(added ? 'Added to Wishlist' : 'Removed from Wishlist', p.name);
  });
}

function validateSelections() {
  if (!selectedSize) {
    setText('size-error', 'Please select a size.');
    document.getElementById('size-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

function updateWishlistBtn(wishlisted) {
  const btn = document.getElementById('wishlist-btn');
  if (!btn) return;
  btn.dataset.wishlistId = product?.id ?? '';
  btn.textContent = wishlisted ? '♥ Remove from Wishlist' : '♡ Add to Wishlist';
  btn.style.color = wishlisted ? 'var(--clr-accent)' : '';
}

// ── Accordion ─────────────────────────────────────────────────
function wireAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const key  = trigger.dataset.accordion;
      const body = document.getElementById(`acc-${key}`);
      const icon = trigger.querySelector('.acc-icon');
      if (!body) return;
      const open = body.classList.toggle('open');
      if (icon) icon.textContent = open ? '−' : '+';
    });
  });
  // Open description by default
  const descBody = document.getElementById('acc-desc');
  const descIcon = document.querySelector('[data-accordion="desc"] .acc-icon');
  if (descBody) { descBody.classList.add('open'); if (descIcon) descIcon.textContent = '−'; }
}

// ── Reviews ───────────────────────────────────────────────────
async function loadReviews(id) {
  const reviews = await getReviews(id);
  const list    = document.getElementById('reviews-list');
  const score   = document.getElementById('reviews-score');
  const stars   = document.getElementById('reviews-stars');
  const label   = document.getElementById('reviews-count-label');

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product?.rating?.toFixed(1) ?? '—';

  if (score) score.textContent = avg;
  if (stars) stars.innerHTML   = renderStars(Number(avg));
  if (label) label.textContent = `${product?.reviewCount ?? reviews.length} reviews`;

  if (!list) return;
  if (!reviews.length) {
    list.innerHTML = `<div class="empty-state" style="padding:var(--sp-8)">
      <div class="empty-icon">◈</div><h3>No Reviews Yet</h3>
      <p>Be the first to review this drop.</p></div>`;
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-card__header">
        <div class="review-avatar">${r.avatar}</div>
        <div>
          <div class="review-author">${r.author}</div>
          <div class="review-date">${new Date(r.date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</div>
        </div>
        <div class="star-rating" style="margin-left:auto">${renderStars(r.rating)}</div>
      </div>
      <p class="review-body">${r.body}</p>
    </div>`).join('');
}

// ── Related products ──────────────────────────────────────────
async function loadRelated(p) {
  const relGrid = document.getElementById('related-grid');
  if (!relGrid) return;
  renderSkeletons(relGrid, 4);
  const all = await getProducts({ category: p.category, sort: 'popularity' });
  const related = all.filter(x => x.id !== p.id).slice(0, 4);
  renderProductGrid(relGrid, related, { showQuickAdd: true });
  wireWishlistButtons(relGrid);
}

// ── Star renderer ─────────────────────────────────────────────
function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => {
    const full = i < Math.floor(rating);
    const half = !full && i < rating;
    return `<span class="star${full ? ' filled' : half ? ' half' : ''}">★</span>`;
  }).join('');
}

// ── Helpers ───────────────────────────────────────────────────
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function clearError(id)    { const el = document.getElementById(id); if (el) el.textContent = ''; }
function show(id)          { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id)          { document.getElementById(id)?.classList.add('hidden'); }
