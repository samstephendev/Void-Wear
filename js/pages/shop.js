/**
 * /js/pages/shop.js
 * Product listing page — filters, sort, URL-param pre-selection, live re-render.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { renderProductGrid, renderSkeletons } from '../components/productCard.js';
import { wireWishlistButtons } from '../components/wishlistWire.js';
import {
  getProducts, getCategories, getAllSizes, getAllColors, getPriceRange
} from '../services/productService.js';

initHeader();
initFooter();

// ── State ─────────────────────────────────────────────────────
const state = {
  category:    '',
  sizes:       [],   // string[]
  colors:      [],   // string[]
  maxPrice:    350,
  absMax:      350,
  sort:        '',
  search:      '',
  inStockOnly: false,
  newOnly:     false,
};

// ── Read URL params on load ───────────────────────────────────
(function readURLParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('category')) state.category = p.get('category');
  if (p.get('search'))   state.search   = p.get('search');
  if (p.get('badge') === 'new') state.newOnly = true;
  if (p.get('sort'))     state.sort     = p.get('sort');
})();

// ── DOM refs ──────────────────────────────────────────────────
const grid           = document.getElementById('product-grid');
const resultsCount   = document.getElementById('results-count');
const mobileCount    = document.getElementById('mobile-results-count');
const sortSelect     = document.getElementById('sort-select');
const mobileSortSel  = document.getElementById('mobile-sort-select');
const priceRange     = document.getElementById('price-range');
const priceMaxLabel  = document.getElementById('price-max-label');
const activeFilters  = document.getElementById('active-filters');
const inStockCb      = document.getElementById('in-stock-only');
const newOnlyCb      = document.getElementById('new-only');
const shopTitle      = document.getElementById('shop-title');
const shopLabel      = document.getElementById('shop-label');

// ── Bootstrap filter UI ───────────────────────────────────────
async function bootstrap() {
  const [categories, sizes, colors, priceInfo] = await Promise.all([
    getCategories(),
    getAllSizes(),
    getAllColors(),
    getPriceRange(),
  ]);

  // Price range
  state.absMax    = priceInfo.max;
  state.maxPrice  = priceInfo.max;
  if (priceRange) {
    priceRange.max   = priceInfo.max;
    priceRange.value = priceInfo.max;
    priceMaxLabel.textContent = `$${priceInfo.max}`;
  }

  // Category filter
  const catBody = document.getElementById('filter-category');
  if (catBody) {
    catBody.innerHTML = `<div class="filter-options">` +
      categories.map(c => `
        <button class="filter-chip${state.category === c.id ? ' active' : ''}"
                data-filter="category" data-value="${c.id}">
          ${c.label}
        </button>`).join('') +
      `</div>`;
  }

  // Size filter
  const sizeOpts = document.getElementById('size-options');
  if (sizeOpts) {
    sizeOpts.innerHTML = sizes.map(s => `
      <button class="filter-chip${state.sizes.includes(s) ? ' active' : ''}"
              data-filter="size" data-value="${s}">
        ${s}
      </button>`).join('');
  }

  // Color filter
  const colorOpts = document.getElementById('color-options');
  if (colorOpts) {
    colorOpts.innerHTML = colors.map(c => `
      <span class="color-filter-dot${state.colors.includes(c.name) ? ' active' : ''}"
            style="background:${c.hex}"
            data-filter="color" data-value="${c.name}"
            title="${c.name}"
            role="button" tabindex="0"
            aria-label="${c.name} color filter"
            aria-pressed="${state.colors.includes(c.name)}">
      </span>`).join('');
  }

  // Pre-set checkboxes
  if (inStockCb) inStockCb.checked = state.inStockOnly;
  if (newOnlyCb) newOnlyCb.checked = state.newOnly;

  // Pre-set sort selects
  if (sortSelect)    sortSelect.value    = state.sort;
  if (mobileSortSel) mobileSortSel.value = state.sort;

  // Update page title
  _updatePageTitle();

  // Initial load
  await loadProducts();
}

// ── Load + render products ────────────────────────────────────
async function loadProducts() {
  renderSkeletons(grid, 6);

  const filters = {
    category:  state.category === 'all' ? '' : state.category,
    sizes:     state.sizes,
    colors:    state.colors,
    maxPrice:  state.maxPrice < state.absMax ? state.maxPrice : undefined,
    sort:      state.sort,
    search:    state.search,
  };
  if (state.inStockOnly) filters.badge = undefined; // handled below
  if (state.newOnly)     filters.badge = 'new';

  let products = await getProducts(filters);

  if (state.inStockOnly) products = products.filter(p => p.stock > 0);

  const count = products.length;
  const label = `${count} product${count !== 1 ? 's' : ''}`;
  if (resultsCount) resultsCount.textContent = label;
  if (mobileCount)  mobileCount.textContent  = label;

  renderProductGrid(grid, products, { showQuickAdd: true });
  wireWishlistButtons(grid);
  _renderActiveFilterTags();
}

// ── Page title ────────────────────────────────────────────────
const CAT_LABELS = {
  hoodies: 'Hoodies', tees: 'Tees', bottoms: 'Bottoms',
  accessories: 'Accessories', footwear: 'Footwear',
};

function _updatePageTitle() {
  let title = 'Shop';
  let label = 'All Products';
  if (state.search) {
    title = `"${state.search}"`;
    label = 'Search Results';
  } else if (state.category && state.category !== 'all') {
    title = CAT_LABELS[state.category] || state.category;
    label = 'Category';
  } else if (state.newOnly) {
    title = 'New Drops';
    label = 'Latest Arrivals';
  }
  if (shopTitle) shopTitle.textContent = title;
  if (shopLabel) shopLabel.textContent = label;
}

// ── Active filter tags ────────────────────────────────────────
function _renderActiveFilterTags() {
  if (!activeFilters) return;
  const tags = [];

  if (state.category && state.category !== 'all') {
    tags.push({ label: CAT_LABELS[state.category] || state.category, key: 'category', value: '' });
  }
  state.sizes.forEach(s => tags.push({ label: `Size: ${s}`, key: 'size', value: s }));
  state.colors.forEach(c => tags.push({ label: `Color: ${c}`, key: 'color', value: c }));
  if (state.maxPrice < state.absMax) tags.push({ label: `Under $${state.maxPrice}`, key: 'price', value: '' });
  if (state.inStockOnly) tags.push({ label: 'In Stock', key: 'instock', value: '' });
  if (state.newOnly)     tags.push({ label: 'New Drops', key: 'new', value: '' });
  if (state.search)      tags.push({ label: `"${state.search}"`, key: 'search', value: '' });

  if (!tags.length) { activeFilters.innerHTML = ''; return; }

  activeFilters.innerHTML =
    tags.map(t => `
      <button class="active-filter-tag" data-remove-key="${t.key}" data-remove-value="${t.value}">
        ${t.label} ×
      </button>`).join('') +
    `<button class="clear-all-btn" id="clear-all-btn">Clear All</button>`;

  // Wire remove buttons
  activeFilters.querySelectorAll('.active-filter-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      _removeFilter(btn.dataset.removeKey, btn.dataset.removeValue);
    });
  });
  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) clearBtn.addEventListener('click', _clearAllFilters);
}

function _removeFilter(key, value) {
  switch (key) {
    case 'category': state.category = ''; break;
    case 'size':     state.sizes    = state.sizes.filter(s => s !== value); break;
    case 'color':    state.colors   = state.colors.filter(c => c !== value); break;
    case 'price':    state.maxPrice = state.absMax; if (priceRange) priceRange.value = state.absMax; break;
    case 'instock':  state.inStockOnly = false; if (inStockCb) inStockCb.checked = false; break;
    case 'new':      state.newOnly  = false; if (newOnlyCb) newOnlyCb.checked = false; break;
    case 'search':   state.search   = ''; break;
  }
  _syncChips();
  _updatePageTitle();
  loadProducts();
}

function _clearAllFilters() {
  state.category    = '';
  state.sizes       = [];
  state.colors      = [];
  state.maxPrice    = state.absMax;
  state.inStockOnly = false;
  state.newOnly     = false;
  state.search      = '';
  if (priceRange)  { priceRange.value = state.absMax; priceMaxLabel.textContent = `$${state.absMax}`; }
  if (inStockCb)   inStockCb.checked  = false;
  if (newOnlyCb)   newOnlyCb.checked  = false;
  _syncChips();
  _updatePageTitle();
  loadProducts();
}

// Keep chip active states in sync with state object
function _syncChips() {
  document.querySelectorAll('[data-filter="category"]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === state.category);
  });
  document.querySelectorAll('[data-filter="size"]').forEach(btn => {
    btn.classList.toggle('active', state.sizes.includes(btn.dataset.value));
  });
  document.querySelectorAll('[data-filter="color"]').forEach(dot => {
    const active = state.colors.includes(dot.dataset.value);
    dot.classList.toggle('active', active);
    dot.setAttribute('aria-pressed', active);
  });
}

// ── Event wiring ──────────────────────────────────────────────
document.addEventListener('click', e => {
  // Filter chips (category + size)
  const chip = e.target.closest('[data-filter]');
  if (chip) {
    const { filter, value } = chip.dataset;
    if (filter === 'category') {
      state.category = state.category === value ? '' : value;
    } else if (filter === 'size') {
      const idx = state.sizes.indexOf(value);
      idx > -1 ? state.sizes.splice(idx, 1) : state.sizes.push(value);
    } else if (filter === 'color') {
      const idx = state.colors.indexOf(value);
      idx > -1 ? state.colors.splice(idx, 1) : state.colors.push(value);
    }
    _syncChips();
    _updatePageTitle();
    loadProducts();
    return;
  }

  // Clear all (sidebar)
  if (e.target.id === 'clear-all-btn') _clearAllFilters();
});

// Color dots keyboard support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const dot = e.target.closest('[data-filter="color"]');
    if (dot) { dot.click(); e.preventDefault(); }
  }
});

// Sort
sortSelect?.addEventListener('change', () => {
  state.sort = sortSelect.value;
  if (mobileSortSel) mobileSortSel.value = state.sort;
  loadProducts();
});
mobileSortSel?.addEventListener('change', () => {
  state.sort = mobileSortSel.value;
  if (sortSelect) sortSelect.value = state.sort;
  loadProducts();
});

// Price range
priceRange?.addEventListener('input', () => {
  state.maxPrice = Number(priceRange.value);
  if (priceMaxLabel) priceMaxLabel.textContent = `$${state.maxPrice}`;
});
priceRange?.addEventListener('change', () => loadProducts());

// Availability checkboxes
inStockCb?.addEventListener('change', () => { state.inStockOnly = inStockCb.checked; loadProducts(); });
newOnlyCb?.addEventListener('change', () => { state.newOnly = newOnlyCb.checked; _updatePageTitle(); loadProducts(); });

// Filter collapse toggles
document.querySelectorAll('[data-filter-toggle]').forEach(title => {
  title.addEventListener('click', () => {
    const body = title.nextElementSibling;
    const icon = title.querySelector('.toggle-icon');
    if (body) body.classList.toggle('collapsed');
    if (icon) icon.textContent = body?.classList.contains('collapsed') ? '+' : '−';
  });
});

// Mobile filter panel
const filterToggleBtn  = document.getElementById('filter-toggle-btn');
const filtersSidebar   = document.getElementById('filters-sidebar');
const applyFiltersBtn  = document.getElementById('apply-filters-btn');

filterToggleBtn?.addEventListener('click', () => {
  filtersSidebar?.classList.toggle('mobile-open');
  if (applyFiltersBtn) applyFiltersBtn.style.display = 'block';
});
applyFiltersBtn?.addEventListener('click', () => {
  filtersSidebar?.classList.remove('mobile-open');
  if (applyFiltersBtn) applyFiltersBtn.style.display = 'none';
});

// ── Go ────────────────────────────────────────────────────────
bootstrap();
