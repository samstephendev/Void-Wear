/**
 * /js/pages/checkout.js
 * Checkout — shipping form, payment UI, validation, place order.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { showToast } from '../components/toast.js';
import { getCart, calculateTotals } from '../services/cartService.js';
import { placeOrder } from '../services/orderService.js';
import { getCurrentUserSync } from '../services/authService.js';

initHeader();
initFooter();

// ── State ─────────────────────────────────────────────────────
let cartItems    = [];
let activeCoupon = null;
let paymentMethod = 'card';

// ── Boot ──────────────────────────────────────────────────────
(async function init() {
  cartItems = await getCart();

  if (!cartItems.length) {
    document.getElementById('checkout-content').classList.add('hidden');
    document.getElementById('checkout-empty').classList.remove('hidden');
    return;
  }

  // Restore coupon from sessionStorage (passed from cart page)
  const saved = sessionStorage.getItem('vw_coupon');
  if (saved) { try { activeCoupon = JSON.parse(saved); } catch {} }

  // Pre-fill from logged-in user
  prefillFromUser();

  renderSummary();
})();

// ── Pre-fill address from logged-in user ──────────────────────
function prefillFromUser() {
  const user = getCurrentUserSync();
  if (!user) return;
  const addr = user.addresses?.find(a => a.isDefault) ?? user.addresses?.[0];
  if (addr) {
    setValue('s-first', addr.firstName);
    setValue('s-last',  addr.lastName);
    setValue('s-line1', addr.line1);
    setValue('s-line2', addr.line2 ?? '');
    setValue('s-city',  addr.city);
    setValue('s-state', addr.state);
    setValue('s-zip',   addr.zip);
    const countryEl = document.getElementById('s-country');
    if (countryEl) countryEl.value = addr.country ?? 'US';
  }
  if (user.email) setValue('s-email', user.email);
}

// ── Render order summary ──────────────────────────────────────
function renderSummary() {
  const itemsEl = document.getElementById('summary-items');
  if (itemsEl) {
    itemsEl.innerHTML = cartItems.map(item => `
      <div class="summary-item">
        <img src="${item.image}" alt="${item.name}"
             onerror="this.src='https://via.placeholder.com/52x64/1a1a1a/444?text=?'" />
        <div style="flex:1;min-width:0">
          <div class="summary-item-name">${item.name}</div>
          <div class="summary-item-meta">${item.color} / ${item.size} × ${item.quantity}</div>
        </div>
        <div class="summary-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>`).join('');
  }

  const t = calculateTotals(cartItems, activeCoupon);
  setText('co-subtotal', `₹${t.subtotal.toFixed(2)}`);
  setText('co-shipping', t.shipping === 0
    ? '<span style="color:var(--clr-accent)">Free</span>'
    : `₹${t.shipping.toFixed(2)}`);
  setText('co-tax',   `₹${t.tax.toFixed(2)}`);
  setText('co-total', `₹${t.total.toFixed(2)}`);

  const discRow = document.getElementById('co-discount-row');
  if (discRow) {
    discRow.style.display = t.discount > 0 ? 'flex' : 'none';
    setText('co-discount', `−₹${t.discount.toFixed(2)}`);
  }
}

// ── Payment method switching ──────────────────────────────────
document.getElementById('payment-methods')?.addEventListener('click', e => {
  const card = e.target.closest('.payment-card');
  if (!card) return;

  paymentMethod = card.dataset.method;

  // Update selected states
  document.querySelectorAll('.payment-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.method === paymentMethod)
  );

  // Show/hide sub-forms
  document.getElementById('card-form').classList.toggle('visible',   paymentMethod === 'card');
  document.getElementById('paypal-form').style.display = paymentMethod === 'paypal' ? 'block' : 'none';
  document.getElementById('apple-form').style.display  = paymentMethod === 'apple'  ? 'block' : 'none';
});

// ── Card number formatting ────────────────────────────────────
document.getElementById('cc-num')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();

  // Detect brand
  const icon = document.getElementById('card-brand-icon');
  if (icon) {
    if      (/^4/.test(v))  icon.textContent = '💳 VISA';
    else if (/^5/.test(v))  icon.textContent = '💳 MC';
    else if (/^3[47]/.test(v)) icon.textContent = '💳 AMEX';
    else                    icon.textContent = '💳';
  }
});

// Expiry auto-slash
document.getElementById('cc-exp')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  e.target.value = v;
});

// CVV digits only
document.getElementById('cc-cvv')?.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// ── Step indicator ────────────────────────────────────────────
function setStep(n) {
  document.querySelectorAll('.checkout-step').forEach(s => {
    const num = Number(s.dataset.step);
    s.classList.toggle('active', num === n);
    s.classList.toggle('done',   num < n);
  });
}

// ── Validation ────────────────────────────────────────────────
function validateShipping() {
  let ok = true;
  const rules = [
    { id: 's-first', errId: 'err-s-first', msg: 'First name is required.' },
    { id: 's-last',  errId: 'err-s-last',  msg: 'Last name is required.' },
    { id: 's-line1', errId: 'err-s-line1', msg: 'Address is required.' },
    { id: 's-city',  errId: 'err-s-city',  msg: 'City is required.' },
    { id: 's-state', errId: 'err-s-state', msg: 'State is required.' },
    { id: 's-zip',   errId: 'err-s-zip',   msg: 'ZIP code is required.' },
    { id: 's-email', errId: 'err-s-email', msg: 'Valid email is required.',
      extra: v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
  ];
  rules.forEach(r => {
    const el  = document.getElementById(r.id);
    const err = document.getElementById(r.errId);
    const val = el?.value?.trim() ?? '';
    let bad   = !val;
    if (!bad && r.extra) bad = r.extra(val);
    if (err) err.textContent = bad ? r.msg : '';
    if (el)  el.classList.toggle('error', bad);
    if (bad) ok = false;
  });
  return ok;
}

function validatePayment() {
  if (paymentMethod !== 'card') return true;
  let ok = true;

  const cardRules = [
    { id: 'cc-name', errId: 'err-cc-name', msg: 'Name on card is required.' },
    { id: 'cc-num',  errId: 'err-cc-num',  msg: 'Valid 16-digit card number required.',
      extra: v => v.replace(/\s/g,'').length < 16 },
    { id: 'cc-exp',  errId: 'err-cc-exp',  msg: 'Expiry MM/YY required.',
      extra: v => !/^\d{2}\/\d{2}$/.test(v) },
    { id: 'cc-cvv',  errId: 'err-cc-cvv',  msg: 'CVV required.',
      extra: v => v.length < 3 },
  ];
  cardRules.forEach(r => {
    const el  = document.getElementById(r.id);
    const err = document.getElementById(r.errId);
    const val = el?.value?.trim() ?? '';
    let bad   = !val;
    if (!bad && r.extra) bad = r.extra(val);
    if (err) err.textContent = bad ? r.msg : '';
    if (el)  el.classList.toggle('error', bad);
    if (bad) ok = false;
  });
  return ok;
}

function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
}

// ── Place order ───────────────────────────────────────────────
document.getElementById('place-order-btn')?.addEventListener('click', async () => {
  clearAllErrors();
  setStep(1);

  const shippingOk = validateShipping();
  if (!shippingOk) { setStep(1); scrollToFirstError(); return; }

  setStep(2);
  const paymentOk = validatePayment();
  if (!paymentOk) { setStep(2); scrollToFirstError(); return; }

  setStep(3);

  const btn = document.getElementById('place-order-btn');
  btn.disabled  = true;
  btn.textContent = 'Placing Order…';
  btn.classList.add('loading');

  try {
    const totals = calculateTotals(cartItems, activeCoupon);

    const shippingAddress = {
      firstName: getValue('s-first'),
      lastName:  getValue('s-last'),
      line1:     getValue('s-line1'),
      line2:     getValue('s-line2') || undefined,
      city:      getValue('s-city'),
      state:     getValue('s-state'),
      zip:       getValue('s-zip'),
      country:   document.getElementById('s-country')?.value ?? 'IN',
    };

    const order = await placeOrder({
      items:           cartItems,
      shippingAddress,
      paymentMethod,
      subtotal:  totals.subtotal,
      shipping:  totals.shipping,
      tax:       totals.tax,
      discount:  totals.discount,
      total:     totals.total,
      couponCode: activeCoupon?.code ?? null,
    });

    // Clear coupon
    sessionStorage.removeItem('vw_coupon');

    // Navigate to confirmation
    location.href = `order-confirmation.html?id=${order.id}`;
  } catch (err) {
    showToast('Order failed', err.message, 'error');
    btn.disabled  = false;
    btn.textContent = 'Place Order';
    btn.classList.remove('loading');
    setStep(1);
  }
});

// ── Helpers ───────────────────────────────────────────────────
function getValue(id)    { return document.getElementById(id)?.value?.trim() ?? ''; }
function setValue(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function setText(id, h)  { const el = document.getElementById(id); if (el) el.innerHTML = h; }

function scrollToFirstError() {
  const first = document.querySelector('.form-control.error');
  first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  first?.focus();
}
