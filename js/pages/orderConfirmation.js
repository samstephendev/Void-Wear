/**
 * /js/pages/orderConfirmation.js
 * Reads the order ID from ?id= or localStorage last_order_id and renders the summary.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getOrderById } from '../services/orderService.js';
import { getItem } from '../utils/storage.js';

initHeader();
initFooter();

const PAYMENT_LABELS = {
  card: 'Credit / Debit Card', paypal: 'PayPal', apple: 'Apple Pay',
};

(async function init() {
  // Prefer URL param, fall back to last_order_id written by placeOrder()
  const orderId = new URLSearchParams(location.search).get('id')
    ?? getItem('last_order_id');

  if (!orderId) { showError(); return; }

  const order = await getOrderById(orderId);
  if (!order) { showError(); return; }

  // Clear last_order_id so refresh doesn't stale-load
  try { localStorage.removeItem('voidwear_last_order_id'); } catch {}

  renderOrder(order);
})();

function renderOrder(order) {
  hide('conf-loading');
  show('conf-content');

  // Order number
  setText('conf-order-num', order.id);
  document.title = `Order ${order.id} — VOIDWEAR`;

  // Items
  const itemsEl = document.getElementById('conf-items');
  if (itemsEl) {
    itemsEl.innerHTML = order.items.map(item => `
      <div class="confirm-item">
        <img src="${item.image}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/56x68/1a1a1a/444?text=?'" />
        <div style="flex:1;min-width:0">
          <div class="confirm-item-name">${item.name}</div>
          <div class="confirm-item-meta">${item.color} / ${item.size} × ${item.quantity}</div>
        </div>
        <div class="confirm-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>`).join('');
  }

  // Address
  const a = order.shippingAddress;
  const addrEl = document.getElementById('conf-address');
  if (addrEl && a) {
    addrEl.innerHTML = `
      ${a.firstName} ${a.lastName}<br>
      ${a.line1}${a.line2 ? '<br>' + a.line2 : ''}<br>
      ${a.city}, ${a.state} ${a.zip}<br>
      ${a.country}`;
  }

  // Payment method
  setText('conf-payment', PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod);

  // Totals
  const totalsEl = document.getElementById('conf-totals');
  if (totalsEl) {
    const rows = [
      ['Subtotal',  `₹${order.subtotal.toFixed(2)}`],
      order.discount > 0 ? ['Discount', `<span style="color:var(--clr-accent)">−₹${order.discount.toFixed(2)}</span>`] : null,
      ['Shipping',  order.shipping === 0 ? '<span style="color:var(--clr-accent)">Free</span>' : `₹${order.shipping.toFixed(2)}`],
      ['Tax',       `₹${order.tax.toFixed(2)}`],
    ].filter(Boolean);

    totalsEl.innerHTML = rows.map(([l, v]) => `
      <tr><td>${l}</td><td>${v}</td></tr>`).join('') + `
      <tr class="grand-total">
        <td>Total</td>
        <td>₹${order.total.toFixed(2)}</td>
      </tr>`;
  }
}

function showError() {
  hide('conf-loading');
  show('conf-error');
}

function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
