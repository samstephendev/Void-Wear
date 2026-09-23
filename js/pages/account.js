/**
 * /js/pages/account.js
 * Account page — order history, saved addresses, wishlist, logout.
 */

import { initHeader, updateHeaderBadges } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { renderProductGrid, renderSkeletons } from '../components/productCard.js';
import { wireWishlistButtons } from '../components/wishlistWire.js';
import { getCurrentUserSync, logout, addAddress, removeAddress } from '../services/authService.js';
import { getOrders } from '../services/orderService.js';
import { getWishlist, removeFromWishlist } from '../services/wishlistService.js';

initHeader();
initFooter();

// ── Auth gate ─────────────────────────────────────────────────
const user = getCurrentUserSync();

if (!user) {
  document.getElementById('account-gate').classList.remove('hidden');
} else {
  document.getElementById('account-content').classList.remove('hidden');
  renderUserInfo(user);
  loadOrders();

  // Open tab from URL hash
  const hash = location.hash.replace('#', '');
  if (['orders', 'addresses', 'wishlist'].includes(hash)) switchPanel(hash);
}

// ── User info ─────────────────────────────────────────────────
function renderUserInfo(u) {
  setText('acc-avatar', u.avatar || (u.firstName[0] + u.lastName[0]).toUpperCase());
  setText('acc-name',   `${u.firstName} ${u.lastName}`);
  setText('acc-email',  u.email);
}

// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll('[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

function switchPanel(name) {
  // Nav items
  document.querySelectorAll('[data-panel]').forEach(b =>
    b.classList.toggle('active', b.dataset.panel === name)
  );
  // Panels
  document.querySelectorAll('.account-panel').forEach(p =>
    p.classList.toggle('active', p.id === `panel-${name}`)
  );
  // Lazy-load on first switch
  if (name === 'addresses') loadAddresses();
  if (name === 'wishlist')  loadWishlist();
  history.replaceState(null, '', `#${name}`);
}

// ── Orders ────────────────────────────────────────────────────
async function loadOrders() {
  const orders = await getOrders();
  hide('orders-loading');

  const list = document.getElementById('orders-list');
  if (!list) return;

  if (!orders.length) {
    list.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-12) 0">
        <div class="empty-icon">📦</div>
        <h3>No Orders Yet</h3>
        <p>Your order history will appear here once you've made a purchase.</p>
        <a href="shop.html" class="btn btn-primary mt-4">Start Shopping</a>
      </div>`;
    return;
  }

  const STATUS_CLASS = {
    confirmed: 'os-confirmed', shipped: 'os-shipped',
    delivered: 'os-delivered', cancelled: 'os-cancelled', pending: 'os-pending',
  };

  list.innerHTML = orders.map(order => {
    const cls   = STATUS_CLASS[order.status] || 'os-pending';
    const label = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    const date  = new Date(order.createdAt).toLocaleDateString('en-US',
      { year:'numeric', month:'short', day:'numeric' });
    const thumbs = order.items.slice(0, 4).map(item => `
      <img class="order-thumb"
           src="${item.image}"
           alt="${item.name}"
           title="${item.name}"
           onerror="this.src='https://via.placeholder.com/52x64/1a1a1a/444?text=?'" />`
    ).join('');
    const extra = order.items.length > 4
      ? `<div style="width:52px;height:64px;background:var(--clr-bg-4);display:flex;
                     align-items:center;justify-content:center;font-size:var(--fs-xs);
                     color:var(--clr-text-3)">+${order.items.length - 4}</div>` : '';

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-id">${order.id}</div>
            <div style="font-size:var(--fs-xs);color:var(--clr-text-3);margin-top:2px">${date}</div>
          </div>
          <span class="order-status ${cls}">
            <span class="status-dot"></span>${label}
          </span>
        </div>
        <div class="order-items-preview">${thumbs}${extra}</div>
        <div class="order-card-footer">
          <div>
            <div class="order-total-label">${order.items.reduce((s,i) => s+i.quantity,0)} items</div>
            <div class="order-total-val">₹${order.total.toFixed(2)}</div>
          </div>
          <a href="order-confirmation.html?id=${order.id}" class="btn btn-secondary btn-sm">
            View Order
          </a>
        </div>
      </div>`;
  }).join('');
}

// ── Addresses ─────────────────────────────────────────────────
function loadAddresses() {
  const freshUser = getCurrentUserSync();
  if (!freshUser) return;
  renderAddresses(freshUser.addresses || []);
}

function renderAddresses(addresses) {
  const grid = document.getElementById('addresses-grid');
  if (!grid) return;

  const cards = addresses.map(addr => `
    <div class="address-card${addr.isDefault ? ' default' : ''}">
      ${addr.isDefault
        ? `<span class="address-default-badge badge badge-limited">Default</span>`
        : ''}
      <div class="address-label">${addr.label || 'Address'}</div>
      <div class="address-text">
        ${addr.firstName} ${addr.lastName}<br>
        ${addr.line1}${addr.line2 ? '<br>' + addr.line2 : ''}<br>
        ${addr.city}, ${addr.state} ${addr.zip}<br>
        ${addr.country}
      </div>
      <div class="address-actions">
        <button class="btn btn-ghost btn-sm remove-addr-btn"
                data-addr-id="${addr.id}"
                style="color:var(--clr-red);font-size:var(--fs-xs)">
          Remove
        </button>
      </div>
    </div>`).join('');

  const addCard = `
    <div class="add-address-card" id="add-address-btn" role="button" tabindex="0"
         aria-label="Add new address">
      <span>+</span>
      <p>Add New Address</p>
    </div>`;

  grid.innerHTML = cards + addCard;

  // Wire remove buttons
  grid.querySelectorAll('.remove-addr-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this address?')) return;
      try {
        await removeAddress(btn.dataset.addrId);
        showToast('Address removed');
        loadAddresses();
      } catch (err) {
        showToast('Error', err.message, 'error');
      }
    });
  });

  // Wire add button
  document.getElementById('add-address-btn')?.addEventListener('click', openAddrModal);
  document.getElementById('add-address-btn')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAddrModal(); }
  });
}

// ── Address modal ─────────────────────────────────────────────
function openAddrModal() {
  document.getElementById('addr-modal').classList.add('open');
  document.getElementById('af-first').focus();
}

function closeAddrModal() {
  document.getElementById('addr-modal').classList.remove('open');
  document.getElementById('addr-form').reset();
  document.querySelectorAll('#addr-form .form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('#addr-form .form-control.error').forEach(el => el.classList.remove('error'));
}

document.getElementById('addr-modal-close')?.addEventListener('click', closeAddrModal);
document.getElementById('addr-modal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAddrModal();
});

document.getElementById('addr-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const rules = [
    ['af-first', 'err-af-first', 'First name required.'],
    ['af-last',  'err-af-last',  'Last name required.'],
    ['af-line1', 'err-af-line1', 'Address required.'],
    ['af-city',  'err-af-city',  'City required.'],
    ['af-state', 'err-af-state', 'State required.'],
    ['af-zip',   'err-af-zip',   'ZIP required.'],
  ];
  let ok = true;
  rules.forEach(([id, errId, msg]) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    const bad = !el?.value?.trim();
    if (err) err.textContent = bad ? msg : '';
    if (el)  el.classList.toggle('error', bad);
    if (bad) ok = false;
  });
  if (!ok) return;

  const saveBtn = document.getElementById('addr-save-btn');
  saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

  try {
    await addAddress({
      label:     'Home',
      firstName: document.getElementById('af-first').value.trim(),
      lastName:  document.getElementById('af-last').value.trim(),
      line1:     document.getElementById('af-line1').value.trim(),
      line2:     document.getElementById('af-line2').value.trim() || undefined,
      city:      document.getElementById('af-city').value.trim(),
      state:     document.getElementById('af-state').value.trim(),
      zip:       document.getElementById('af-zip').value.trim(),
      country:   document.getElementById('af-country').value,
    });
    showToast('Address saved');
    closeAddrModal();
    loadAddresses();
  } catch (err) {
    showToast('Error', err.message, 'error');
  } finally {
    saveBtn.disabled = false; saveBtn.textContent = 'Save Address';
  }
});

// ── Wishlist ──────────────────────────────────────────────────
async function loadWishlist() {
  const wishlistGrid = document.getElementById('acc-wishlist-grid');
  if (!wishlistGrid) return;
  renderSkeletons(wishlistGrid, 3);

  const items = await getWishlist();
  if (!items.length) {
    wishlistGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:var(--sp-12) 0">
        <div class="empty-icon">♡</div>
        <h3>Your Wishlist is Empty</h3>
        <p>Save items you love and they'll appear here.</p>
        <a href="shop.html" class="btn btn-primary mt-4">Browse Drops</a>
      </div>`;
    return;
  }

  // Map wishlist items to product-card-compatible shape
  const products = items.map(i => ({
    id: i.productId, name: i.name, brand: i.brand, category: i.category,
    price: i.price, images: [i.image], badge: i.badge, stock: i.stock,
    colors: [], sizes: [], rating: 0, reviewCount: 0,
    description: '', details: [], isNew: false, isFeatured: false,
    createdAt: i.addedAt, popularity: 0,
  }));

  renderProductGrid(wishlistGrid, products, { showQuickAdd: false });
  wireWishlistButtons(wishlistGrid);
}

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await logout();
  updateHeaderBadges();
  location.href = 'index.html';
});

// ── Helpers ───────────────────────────────────────────────────
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function hide(id)        { document.getElementById(id)?.classList.add('hidden'); }
function show(id)        { document.getElementById(id)?.classList.remove('hidden'); }
