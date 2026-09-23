/**
 * /js/pages/home.js
 * Home page — hero, category grid, countdown, featured products, new drops.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid, renderSkeletons } from '../components/productCard.js';
import { wireWishlistButtons } from '../components/wishlistWire.js';
import { getFeaturedProducts, getNewDrops, getCategories, getFeaturedDrop } from '../services/productService.js';
import { getCurrentUserSync } from '../services/authService.js';
import { runDevSeed } from '../utils/devSeed.js';

// ── Category images ───────────────────────────────────────────
const CAT_IMAGES = {
  hoodies:     'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=75',
  tees:        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=75',
  bottoms:     'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=75',
  accessories: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=75',
  footwear:    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=75',
};

const CAT_COUNTS = {
  hoodies: 3, tees: 4, bottoms: 3, accessories: 3, footwear: 3,
};

// ── Init ──────────────────────────────────────────────────────
initHeader();
initFooter();

// Animate hero BG
const heroBg = document.getElementById('hero-bg');
if (heroBg) setTimeout(() => heroBg.classList.add('loaded'), 100);

// Build ticker
buildTicker();

// ── Dev seed + page boot ──────────────────────────────────────
// runDevSeed() is a no-op when DEV_SEED = false, so this branch
// is safe to leave in production. We await it so that the
// auto-login (which has a fake network delay) is settled before
// we hide the hero login button and refresh the header badges.
runDevSeed().then(() => {
  // Hide "Login / Sign Up" hero button if user is now logged in
  const heroLoginBtn = document.getElementById('hero-login-btn');
  if (heroLoginBtn && getCurrentUserSync()) {
    heroLoginBtn.style.display = 'none';
  }

  // Re-render header badges to reflect seeded cart + wishlist counts
  import('../components/header.js').then(({ updateHeaderBadges }) => updateHeaderBadges());
});

// Load all sections in parallel (don't block on seed)
Promise.all([
  loadCategories(),
  loadFeaturedProducts(),
  loadNewDrops(),
  loadDropCountdown(),
]);

// ── Ticker ────────────────────────────────────────────────────
function buildTicker() {
  const items = [
    'New Drop 001', '◈', 'Free Shipping Over $100', '◈',
    'Limited Runs', '◈', '450gsm Fleece', '◈',
    'No Restocks', '◈', 'Worldwide Shipping', '◈',
    'New Drop 001', '◈', 'Free Shipping Over $100', '◈',
    'Limited Runs', '◈', '450gsm Fleece', '◈',
    'No Restocks', '◈', 'Worldwide Shipping', '◈',
  ];
  const el = document.getElementById('ticker-inner');
  if (!el) return;
  el.innerHTML = items.map((t, i) =>
    i % 2 === 1
      ? `<span class="ticker-sep">${t}</span>`
      : `<span class="ticker-item">${t}</span>`
  ).join('');
}

// ── Categories ────────────────────────────────────────────────
async function loadCategories() {
  const categories = await getCategories();
  const grid = document.getElementById('cat-grid');
  if (!grid) return;

  const cats = categories.filter(c => c.id !== 'all');
  grid.innerHTML = cats.map(cat => `
    <a href="shop.html?category=${cat.id}" class="cat-card">
      <img
        src="${CAT_IMAGES[cat.id] || ''}"
        alt="${cat.label}"
        loading="lazy"
        onerror="this.style.display='none'"
      />
      <div class="cat-card__label">
        ${cat.label}
        <span class="cat-card__count">${CAT_COUNTS[cat.id] ?? ''} styles</span>
      </div>
    </a>
  `).join('');
}

// ── Featured products ─────────────────────────────────────────
async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  renderSkeletons(grid, 5);
  const products = await getFeaturedProducts(5);
  renderProductGrid(grid, products, { showQuickAdd: true });
  wireWishlistButtons(grid);
}

// ── New drops ─────────────────────────────────────────────────
async function loadNewDrops() {
  const grid = document.getElementById('new-drops-grid');
  if (!grid) return;
  renderSkeletons(grid, 4);
  const products = await getNewDrops(4);
  renderProductGrid(grid, products, { showQuickAdd: true });
  wireWishlistButtons(grid);
}

// ── Drop countdown ────────────────────────────────────────────
async function loadDropCountdown() {
  const drop = await getFeaturedDrop();
  if (!drop) return;

  const titleEl    = document.getElementById('drop-title');
  const subtitleEl = document.getElementById('drop-subtitle');
  const descEl     = document.getElementById('drop-desc');
  const imgEl      = document.getElementById('drop-img');
  const ctaEl      = document.getElementById('drop-cta');

  if (titleEl)    titleEl.textContent    = drop.title;
  if (subtitleEl) subtitleEl.textContent = drop.subtitle;
  if (descEl)     descEl.textContent     = drop.description;
  if (imgEl)      imgEl.src              = drop.heroImage;
  if (ctaEl)      ctaEl.href             = `product.html?id=${drop.productId}`;

  const target = new Date(drop.dropDate).getTime();
  startCountdown(target);
}

function startCountdown(targetMs) {
  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');
  if (!dEl) return;

  function tick() {
    const now  = Date.now();
    const diff = Math.max(0, targetMs - now);

    const days  = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins  = Math.floor((diff % 3_600_000) / 60_000);
    const secs  = Math.floor((diff % 60_000) / 1_000);

    dEl.textContent = String(days).padStart(2, '0');
    hEl.textContent = String(hours).padStart(2, '0');
    mEl.textContent = String(mins).padStart(2, '0');
    sEl.textContent = String(secs).padStart(2, '0');

    if (diff > 0) requestAnimationFrame(() => setTimeout(tick, 1000));
    else {
      // Drop is live
      const label = document.querySelector('.drop-timer-label');
      if (label) label.textContent = 'Drop is live now!';
    }
  }
  tick();
}

