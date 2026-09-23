/**
 * /js/services/orderService.js
 * ─────────────────────────────────────────────────────────────
 * Order creation and history — backed by localStorage.
 *
 * BACKEND SWAP: Replace function bodies with API calls:
 *   getOrders()          → GET  /orders         (auth required)
 *   getOrderById(id)     → GET  /orders/:id
 *   placeOrder(payload)  → POST /orders
 *   validateCoupon(code) → POST /coupons/validate
 * ─────────────────────────────────────────────────────────────
 */

import { MOCK_ORDERS, MOCK_COUPONS } from '../data/orders.js';
import { getItem, setItem, KEYS } from '../utils/storage.js';
import { getCurrentUserSync } from './authService.js';
import { clearCart } from './cartService.js';

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

function generateOrderId() {
  const year = new Date().getFullYear();
  const seq  = String(Math.floor(Math.random() * 9000) + 1000);
  return `ORD-${year}-${seq}`;
}

/** Seed orders from mock data if storage is empty */
function getOrderRegistry() {
  const stored = getItem(KEYS.ORDERS);
  if (!stored) {
    setItem(KEYS.ORDERS, MOCK_ORDERS);
    return [...MOCK_ORDERS];
  }
  return stored;
}

function saveOrderRegistry(orders) {
  setItem(KEYS.ORDERS, orders);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get all orders for the current user.
 * @returns {Promise<object[]>}
 */
export async function getOrders() {
  await delay(400);
  const user = getCurrentUserSync();
  if (!user) return [];
  const orders = getOrderRegistry();
  return orders
    .filter(o => o.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a single order by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getOrderById(id) {
  await delay(300);
  const orders = getOrderRegistry();
  return orders.find(o => o.id === id) ?? null;
}

/**
 * Place a new order.
 * Clears the cart and persists the order to storage.
 *
 * @param {{
 *   items           : object[],   — cart items
 *   shippingAddress : object,
 *   paymentMethod   : string,
 *   subtotal        : number,
 *   shipping        : number,
 *   tax             : number,
 *   discount        : number,
 *   total           : number,
 *   couponCode?     : string,
 * }} payload
 * @returns {Promise<object>} the created order
 */
export async function placeOrder(payload) {
  await delay(800); // simulate payment processing
  const user = getCurrentUserSync();

  const order = {
    id:      generateOrderId(),
    userId:  user ? user.id : 'guest',
    status:  'confirmed',
    items:   payload.items.map(ci => ({
      productId: ci.productId,
      name:      ci.name,
      image:     ci.image,
      color:     ci.color,
      size:      ci.size,
      price:     ci.price,
      quantity:  ci.quantity,
    })),
    shippingAddress:  payload.shippingAddress,
    paymentMethod:    payload.paymentMethod,
    subtotal:         payload.subtotal,
    shipping:         payload.shipping,
    tax:              payload.tax,
    discount:         payload.discount,
    total:            payload.total,
    couponCode:       payload.couponCode ?? null,
    createdAt:        new Date().toISOString(),
    updatedAt:        new Date().toISOString(),
    trackingNumber:   null,
    estimatedDelivery: null,
  };

  const orders = getOrderRegistry();
  orders.unshift(order);
  saveOrderRegistry(orders);

  // Clear the cart after successful order
  await clearCart();

  // Persist the just-placed order ID so order-confirmation page can pick it up
  setItem('last_order_id', order.id);

  return order;
}

/**
 * Validate a coupon code.
 * @param {string} code
 * @param {number} subtotal — needed to check minOrder
 * @returns {Promise<{ valid: boolean, coupon?: object, message?: string }>}
 */
export async function validateCoupon(code, subtotal) {
  await delay(400);
  if (!code || !code.trim()) {
    return { valid: false, message: 'Enter a coupon code.' };
  }
  const found = MOCK_COUPONS.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!found) {
    return { valid: false, message: 'Invalid coupon code.' };
  }
  if (subtotal < found.minOrder) {
    return { valid: false, message: `Minimum order $${found.minOrder} required for this code.` };
  }
  return { valid: true, coupon: found };
}
