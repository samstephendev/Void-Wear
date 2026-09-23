/**
 * /js/services/cartService.js
 * ─────────────────────────────────────────────────────────────
 * Cart operations — backed by localStorage for persistence.
 *
 * BACKEND SWAP: For a server-side cart replace the localStorage
 * reads/writes with API calls:
 *   getCart()              → GET  /cart
 *   addToCart(item)        → POST /cart/items
 *   updateQuantity(id, q)  → PUT  /cart/items/:id
 *   removeFromCart(id)     → DELETE /cart/items/:id
 *   clearCart()            → DELETE /cart
 *
 * CartItem shape:
 * {
 *   cartItemId : string   — unique per cart line (productId+color+size)
 *   productId  : string
 *   name       : string
 *   brand      : string
 *   image      : string
 *   color      : string
 *   size       : string
 *   price      : number
 *   quantity   : number
 *   stock      : number   — max available
 * }
 * ─────────────────────────────────────────────────────────────
 */

import { getItem, setItem, KEYS } from '../utils/storage.js';

const FAKE_DELAY = 200;
const delay = (ms = FAKE_DELAY) => new Promise(r => setTimeout(r, ms));

function makeCartItemId(productId, color, size) {
  return `${productId}__${color}__${size}`;
}

function readCart() {
  return getItem(KEYS.CART, []);
}

function writeCart(items) {
  setItem(KEYS.CART, items);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get all cart items.
 * @returns {Promise<object[]>}
 */
export async function getCart() {
  await delay(150);
  return readCart();
}

/**
 * Add a product to the cart, or increment quantity if already present.
 * @param {{ productId, name, brand, image, color, size, price, stock }} item
 * @param {number} [quantity=1]
 * @returns {Promise<object[]>} updated cart
 */
export async function addToCart(item, quantity = 1) {
  await delay();
  const cart = readCart();
  const id   = makeCartItemId(item.productId, item.color, item.size);
  const idx  = cart.findIndex(ci => ci.cartItemId === id);

  if (idx > -1) {
    const newQty = Math.min(cart[idx].quantity + quantity, item.stock ?? 99);
    cart[idx].quantity = newQty;
  } else {
    cart.push({
      cartItemId: id,
      productId:  item.productId,
      name:       item.name,
      brand:      item.brand,
      image:      item.image,
      color:      item.color,
      size:       item.size,
      price:      item.price,
      quantity:   Math.min(quantity, item.stock ?? 99),
      stock:      item.stock ?? 99,
    });
  }
  writeCart(cart);
  return cart;
}

/**
 * Update the quantity of a specific cart line.
 * Setting quantity to 0 removes the item.
 * @param {string} cartItemId
 * @param {number} quantity
 * @returns {Promise<object[]>} updated cart
 */
export async function updateQuantity(cartItemId, quantity) {
  await delay();
  let cart = readCart();
  if (quantity <= 0) {
    cart = cart.filter(ci => ci.cartItemId !== cartItemId);
  } else {
    const idx = cart.findIndex(ci => ci.cartItemId === cartItemId);
    if (idx > -1) {
      cart[idx].quantity = Math.min(quantity, cart[idx].stock ?? 99);
    }
  }
  writeCart(cart);
  return cart;
}

/**
 * Remove an item from the cart entirely.
 * @param {string} cartItemId
 * @returns {Promise<object[]>} updated cart
 */
export async function removeFromCart(cartItemId) {
  await delay();
  const cart = readCart().filter(ci => ci.cartItemId !== cartItemId);
  writeCart(cart);
  return cart;
}

/**
 * Clear the entire cart.
 * @returns {Promise<[]>}
 */
export async function clearCart() {
  await delay(100);
  writeCart([]);
  return [];
}

/**
 * Get the total number of items in the cart (sum of quantities).
 * Synchronous — used for badge counts on page init.
 * @returns {number}
 */
export function getCartCountSync() {
  const cart = readCart();
  return cart.reduce((sum, ci) => sum + ci.quantity, 0);
}

/**
 * Calculate cart totals given an optional coupon.
 * @param {object[]|null} [cartItems] — pass null to read from storage
 * @param {{ type, value }|null} [coupon]
 * @returns {{ subtotal, shipping, discount, tax, total }}
 */
export function calculateTotals(cartItems = null, coupon = null) {
  const items = cartItems ?? readCart();
  const subtotal = items.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const FREE_SHIPPING_THRESHOLD = 100;
  const SHIPPING_RATE = 9.99;
  const TAX_RATE = 0.0875; // 8.75%

  let shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  let discount = 0;

  if (coupon) {
    if (coupon.type === 'percent') {
      discount = parseFloat(((subtotal * coupon.value) / 100).toFixed(2));
    } else if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'shipping') {
      shipping = 0;
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const tax     = parseFloat((taxable * TAX_RATE).toFixed(2));
  const total   = parseFloat((taxable + shipping + tax).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    tax,
    total,
  };
}
