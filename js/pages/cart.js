/**
 * /js/pages/cart.js
 * Cart page — render items, quantity controls, remove, coupon, totals.
 */

import { initHeader, updateHeaderBadges } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import {
  getCart, updateQuantity, removeFromCart,
  clearCart, calculateTotals
} from '../services/cartService.js';
import { validateCoupon } from '../services/orderService.js';

initHeader();
initFooter();

// ── State ─────────────────────────────────────────────────────
let cartItems  = [];
let activeCoupon = null;  // { type, value, code }

// ── Boot ──────────────────────────────────────────────────────
loadCart();

async function loadCart() {
  cartItems = await getCart();
  hide('cart-loading');

  if (!cartItems.length) {
    show('cart-empty');
  } else {
    show('cart-content');
    renderItems();
    renderTotals();
  }
}

// ── Render items ──────────────────────────────────────────────
function renderItems() {
  const list = document.getElementById('cart-items-list');
  if (!list) return;

  document.getElementById('item-count').textContent =
    cartItems.reduce((s, i) => s + i.quantity, 0);

  list.innerHTML = cartItems.map(item => `
    <div class="cart-item-row" data-cart-id="${item.cartItemId}">
      <a href="product.html?id=${item.productId}">
        <img class="cart-item-img"
             src="${item.image}"
             alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/88x108/1a1a1a/444?text=?'" />
      </a>

      <div>
        <a class="cart-item-name" href="product.html?id=${item.productId}">${item.name}</a>
        <div class="cart-item-meta">${item.color} / ${item.size}</div>
        <div class="qty-picker">
          <button class="qty-dec" data-id="${item.cartItemId}"
                  aria-label="Decrease quantity">−</button>
          <input type="number" value="${item.quantity}" min="1"
                 max="${item.stock}" readonly
                 aria-label="Quantity for ${item.name}" />
          <button class="qty-inc" data-id="${item.cartItemId}"
                  data-max="${item.stock}" aria-label="Increase quantity">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.cartItemId}">Remove</button>
      </div>

      <div></div><!-- spacer col -->

      <div style="text-align:right">
        <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
        <div style="font-size:var(--fs-xs);color:var(--clr-text-3);margin-top:2px">
          ₹${item.price} each
        </div>
      </div>
    </div>`).join('');

  wireItemButtons(list);
}

// ── Wire per-item controls ────────────────────────────────────
function wireItemButtons(list) {
  list.addEventListener('click', async e => {
    const decBtn    = e.target.closest('.qty-dec');
    const incBtn    = e.target.closest('.qty-inc');
    const removeBtn = e.target.closest('.cart-item-remove');

    if (decBtn) {
      const id   = decBtn.dataset.id;
      const item = cartItems.find(i => i.cartItemId === id);
      if (!item) return;
      if (item.quantity <= 1) {
        await handleRemove(id, item.name);
      } else {
        cartItems = await updateQuantity(id, item.quantity - 1);
        refresh();
      }
    }

    if (incBtn) {
      const id   = incBtn.dataset.id;
      const max  = Number(incBtn.dataset.max) || 99;
      const item = cartItems.find(i => i.cartItemId === id);
      if (!item || item.quantity >= max) return;
      cartItems = await updateQuantity(id, item.quantity + 1);
      refresh();
    }

    if (removeBtn) {
      const id   = removeBtn.dataset.id;
      const item = cartItems.find(i => i.cartItemId === id);
      await handleRemove(id, item?.name ?? '');
    }
  });
}

async function handleRemove(id, name) {
  cartItems = await removeFromCart(id);
  showToast('Removed', name);
  updateHeaderBadges();
  if (!cartItems.length) {
    hide('cart-content');
    show('cart-empty');
  } else {
    refresh();
  }
}

// ── Clear cart ────────────────────────────────────────────────
document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
  if (!confirm('Clear your entire cart?')) return;
  await clearCart();
  cartItems = [];
  activeCoupon = null;
  updateHeaderBadges();
  hide('cart-content');
  show('cart-empty');
  showToast('Cart cleared', 'All items removed.');
});

// ── Coupon ────────────────────────────────────────────────────
document.getElementById('coupon-btn')?.addEventListener('click', applyCoupon);
document.getElementById('coupon-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyCoupon();
});

async function applyCoupon() {
  const input  = document.getElementById('coupon-input');
  const result = document.getElementById('coupon-result');
  const code   = input?.value?.trim();
  if (!code) return;

  const couponBtn = document.getElementById('coupon-btn');
  couponBtn.disabled  = true;
  couponBtn.textContent = '…';

  const totals   = calculateTotals(cartItems);
  const response = await validateCoupon(code, totals.subtotal);

  couponBtn.disabled  = false;
  couponBtn.textContent = 'Apply';

  if (result) {
    if (response.valid) {
      activeCoupon = { ...response.coupon, code };
      result.className  = 'coupon-result success';
      const desc = response.coupon.type === 'percent'
        ? `${response.coupon.value}% off applied`
        : response.coupon.type === 'fixed'
          ? `₹${response.coupon.value} off applied`
          : 'Free shipping applied';
      result.textContent = `✓ ${code.toUpperCase()} — ${desc}`;
    } else {
      activeCoupon = null;
      result.className  = 'coupon-result error';
      result.textContent = `✗ ${response.message}`;
    }
    renderTotals();
  }
}

// ── Totals ────────────────────────────────────────────────────
function renderTotals() {
  const totals = calculateTotals(cartItems, activeCoupon);

  setText('summary-subtotal', `₹${totals.subtotal.toFixed(2)}`);
  setText('summary-shipping',
    totals.shipping === 0 ? '<span style="color:var(--clr-accent)">Free</span>' : `₹${totals.shipping.toFixed(2)}`);
  setText('summary-tax',   `₹${totals.tax.toFixed(2)}`);
  setText('summary-total', `₹${totals.total.toFixed(2)}`);

  const discountRow = document.getElementById('discount-row');
  if (discountRow) {
    discountRow.style.display = totals.discount > 0 ? 'flex' : 'none';
    setText('summary-discount', `−₹${totals.discount.toFixed(2)}`);
  }

  const shippingNote = document.getElementById('shipping-note');
  if (shippingNote) {
    if (totals.shipping === 0) {
      shippingNote.innerHTML = `<strong>✓ You qualify for free shipping!</strong>`;
    } else {
      const needed = (2000 - totals.subtotal).toFixed(2);
      shippingNote.innerHTML = `Add <strong>₹${needed}</strong> more for free shipping.`;
    }
  }

  // Persist coupon + totals so checkout page can read them
  if (activeCoupon) {
    sessionStorage.setItem('vw_coupon', JSON.stringify(activeCoupon));
  } else {
    sessionStorage.removeItem('vw_coupon');
  }
}

// ── Full refresh ──────────────────────────────────────────────
function refresh() {
  renderItems();
  renderTotals();
  updateHeaderBadges();
}

// ── Helpers ───────────────────────────────────────────────────
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
