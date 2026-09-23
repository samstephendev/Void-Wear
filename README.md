# VOIDWEAR — Streetwear E-Commerce Site

A frontend-only streetwear e-commerce site built with plain **HTML5**, **CSS3**, and **vanilla JavaScript ES6 modules**. No frameworks, no build tools, no dependencies — open `index.html` directly in a browser or serve with any static file server.

---

## Quick Start

```bash
# Any static server works. Examples:
npx serve .
python -m http.server 8080
# or just open index.html directly in Chrome/Firefox/Edge
```

**Demo login credentials**
- Email: `demo@voidwear.com`
- Password: `demo1234`

---

## Folder Structure

```
/
├── index.html                  Home page
├── shop.html                   Product listing + filters
├── product.html                Product detail (loads by ?id=)
├── cart.html                   Shopping cart
├── checkout.html               Checkout flow
├── order-confirmation.html     Post-order success page
├── login.html                  Login
├── signup.html                 Create account
├── account.html                User account (orders, addresses, wishlist)
├── wishlist.html               Wishlist
│
├── css/
│   └── main.css                All styles — CSS custom properties, components,
│                               responsive breakpoints. No external CSS.
│
├── js/
│   ├── data/                   ← MOCK DATA LAYER (delete when backend is live)
│   │   ├── products.js         15 products across 5 categories
│   │   ├── orders.js           Sample order history + coupon codes
│   │   └── users.js            Sample user accounts
│   │
│   ├── services/               ← SERVICE LAYER (only files to change for backend)
│   │   ├── productService.js   getProducts, getProductById, searchProducts, …
│   │   ├── authService.js      login, signup, logout, getCurrentUser, …
│   │   ├── cartService.js      getCart, addToCart, updateQuantity, calculateTotals, …
│   │   ├── wishlistService.js  getWishlist, addToWishlist, toggleWishlist, …
│   │   └── orderService.js     getOrders, getOrderById, placeOrder, validateCoupon
│   │
│   ├── utils/
│   │   └── storage.js          Centralised localStorage wrapper (get/set/remove)
│   │
│   ├── components/             Shared UI components injected into every page
│   │   ├── header.js           Site header with live search, nav, badges
│   │   ├── footer.js           Site footer
│   │   ├── productCard.js      renderProductCard, renderProductGrid, renderSkeletons
│   │   ├── toast.js            showToast(title, body, type)
│   │   └── wishlistWire.js     Event delegation for wishlist heart buttons
│   │
│   └── pages/                  One file per page — DOM logic only, no data access
│       ├── home.js
│       ├── shop.js
│       ├── product.js
│       ├── cart.js
│       ├── checkout.js
│       ├── orderConfirmation.js
│       ├── login.js
│       ├── signup.js
│       ├── account.js
│       └── wishlist.js
│
└── images/                     Drop product/hero images here (currently uses Unsplash URLs)
    ├── products/
    └── hero/
```

---

## Data Shapes

All mock data lives in `/js/data/`. Each shape is documented below with the exact field names used throughout the codebase.

### Product

```js
{
  id            : string,       // URL-safe slug, e.g. "blk-arch-hoodie"
  name          : string,       // Display name, e.g. "ARCH LOGO HOODIE"
  brand         : string,       // e.g. "VOIDWEAR"
  category      : string,       // "hoodies" | "tees" | "bottoms" | "accessories" | "footwear"
  price         : number,       // Current price (USD), e.g. 119
  originalPrice : number|null,  // Pre-sale price, null if not on sale
  images        : string[],     // Array of image URLs, first = primary
  colors        : { name: string, hex: string }[],
  sizes         : string[],     // e.g. ["XS","S","M","L","XL"] or ["28","30","32"]
  tags          : string[],     // For search, e.g. ["hoodie","oversized","logo"]
  badge         : "new" | "limited" | "sold-out" | "sale" | null,
  stock         : number,       // Units remaining; 0 = sold out
  rating        : number,       // 1–5
  reviewCount   : number,
  description   : string,
  details       : string[],     // Bullet-point material/spec list
  isNew         : boolean,
  isFeatured    : boolean,
  createdAt     : string,       // ISO 8601 date string
  popularity    : number,       // Arbitrary score for popularity sort
}
```

### User

```js
{
  id        : string,       // e.g. "usr_001"
  email     : string,
  password  : string,       // Plain text — ONLY acceptable for mock data
  firstName : string,
  lastName  : string,
  avatar    : string,       // Two-letter initials, e.g. "AV"
  createdAt : string,       // ISO 8601
  addresses : Address[],
  wishlist  : string[],     // Array of product IDs (legacy field, not actively used)
}
```

### Address

```js
{
  id        : string,
  label     : string,       // e.g. "Home", "Work"
  firstName : string,
  lastName  : string,
  line1     : string,
  line2     : string | undefined,
  city      : string,
  state     : string,       // 2-letter code
  zip       : string,
  country   : string,       // 2-letter ISO code, e.g. "US"
  isDefault : boolean,
}
```

### CartItem

```js
{
  cartItemId : string,   // Composite key: "{productId}__{color}__{size}"
  productId  : string,
  name       : string,
  brand      : string,
  image      : string,   // Single image URL
  color      : string,
  size       : string,
  price      : number,
  quantity   : number,
  stock      : number,   // Max purchasable quantity
}
```

### WishlistItem

```js
{
  productId : string,
  name      : string,
  brand     : string,
  category  : string,
  price     : number,
  image     : string,
  badge     : string | null,
  stock     : number,
  addedAt   : string,   // ISO 8601
}
```

### Order

```js
{
  id              : string,     // e.g. "ORD-2026-0042"
  userId          : string,
  status          : "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  items           : OrderItem[],
  shippingAddress : Address,
  paymentMethod   : "card" | "paypal" | "apple",
  subtotal        : number,
  shipping        : number,
  tax             : number,
  discount        : number,
  total           : number,
  couponCode      : string | null,
  createdAt       : string,
  updatedAt       : string,
  trackingNumber  : string | null,
  estimatedDelivery : string | null,
}
```

### OrderItem

```js
{
  productId : string,
  name      : string,
  image     : string,
  color     : string,
  size      : string,
  price     : number,
  quantity  : number,
}
```

### Review

```js
{
  id     : string,
  author : string,
  avatar : string,   // Two-letter initials
  rating : number,   // 1–5
  date   : string,   // ISO 8601 date string
  body   : string,
}
```

### Coupon

```js
{
  code     : string,                         // e.g. "VOID10"
  type     : "percent" | "fixed" | "shipping",
  value    : number,                         // Percentage, fixed $ amount, or 0 for free shipping
  minOrder : number,                         // Minimum subtotal to activate
}
```

---

## Connecting a Real Backend

**The rule is simple: only edit files in `/js/services/`. Never touch `/js/pages/` or `/js/components/`.**

All service functions already return `Promise`s with the same shape as real API responses. Swapping them to `fetch()` calls is a drop-in replacement.

### Step-by-step

#### 1. productService.js → REST product API

```js
// BEFORE (mock)
export async function getProducts(filters = {}) {
  await delay();
  let results = [...PRODUCTS];
  // ... filter logic
  return results;
}

// AFTER (real API)
export async function getProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category)  params.set('category', filters.category);
  if (filters.sort)      params.set('sort', filters.sort);
  if (filters.search)    params.set('q', filters.search);
  if (filters.maxPrice)  params.set('maxPrice', filters.maxPrice);
  const res = await fetch(`/api/products?${params}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();  // must return Product[]
}
```

Do the same for: `getProductById`, `getFeaturedProducts`, `getNewDrops`, `searchProducts`, `getReviews`, `getCategories`, `getFeaturedDrop`.

Then **delete** `/js/data/products.js` — it is no longer needed.

#### 2. authService.js → JWT / session auth

```js
// BEFORE (mock)
export async function login(email, password) {
  await delay();
  const found = getUserRegistry().find(u => u.email === email && u.password === password);
  if (!found) throw new Error('Invalid email or password.');
  setItem(KEYS.AUTH_USER, sanitizeUser(found));
  return { user: sanitizeUser(found) };
}

// AFTER (real API)
export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Invalid email or password.');
  }
  const { user, token } = await res.json();
  setItem(KEYS.AUTH_USER, user);
  setItem('auth_token', token);   // store JWT if using token auth
  return { user };
}
```

If using HTTP-only cookies instead of a stored token, remove the `setItem('auth_token', …)` line — the browser handles it automatically.

Do the same for: `signup`, `logout`, `getCurrentUser`, `updateProfile`, `addAddress`, `removeAddress`.

For `getCurrentUser`, if your server validates the session on load:

```js
export async function getCurrentUser() {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${getItem('auth_token')}` },
  });
  if (!res.ok) { removeItem(KEYS.AUTH_USER); return null; }
  const { user } = await res.json();
  setItem(KEYS.AUTH_USER, user);
  return user;
}
```

Then **delete** `/js/data/users.js`.

#### 3. cartService.js → server-side cart

```js
export async function getCart() {
  const res = await fetch('/api/cart', { credentials: 'include' });
  return res.json();  // must return CartItem[]
}

export async function addToCart(item, quantity = 1) {
  const res = await fetch('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId: item.productId, color: item.color,
                           size: item.size, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();  // must return updated CartItem[]
}

export async function updateQuantity(cartItemId, quantity) {
  const res = await fetch(`/api/cart/items/${cartItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function removeFromCart(cartItemId) {
  const res = await fetch(`/api/cart/items/${cartItemId}`, {
    method: 'DELETE', credentials: 'include',
  });
  return res.json();
}
```

Note: `calculateTotals` is pure maths — keep it client-side or replace with a server calculation returned from the order endpoint.

#### 4. orderService.js → order API

```js
export async function placeOrder(payload) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getItem('auth_token')}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Order failed. Please try again.');
  return res.json();  // must return Order
}

export async function getOrders() {
  const res = await fetch('/api/orders', {
    headers: { Authorization: `Bearer ${getItem('auth_token')}` },
  });
  return res.json();  // must return Order[]
}

export async function validateCoupon(code, subtotal) {
  const res = await fetch('/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  return res.json();  // must return { valid, coupon?, message? }
}
```

Then **delete** `/js/data/orders.js`.

#### 5. wishlistService.js → user wishlist API

```js
export async function getWishlist() {
  const res = await fetch('/api/wishlist', {
    headers: { Authorization: `Bearer ${getItem('auth_token')}` },
  });
  return res.json();  // must return WishlistItem[]
}

export async function addToWishlist(product) {
  const res = await fetch('/api/wishlist/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getItem('auth_token')}`,
    },
    body: JSON.stringify({ productId: product.id }),
  });
  return res.json();
}

export async function removeFromWishlist(productId) {
  const res = await fetch(`/api/wishlist/items/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getItem('auth_token')}` },
  });
  return res.json();
}
```

#### 6. storage.js — keep or remove

`storage.js` remains useful for caching auth tokens and non-sensitive UI state client-side. If you move entirely to HTTP-only cookies you can remove the auth-related `setItem`/`getItem` calls from the auth service, but the rest of the storage layer (cart count sync, UI preferences) can stay.

---

## Files to Delete When Going Live

| File | Why |
|---|---|
| `js/data/products.js` | Replaced by product API |
| `js/data/users.js` | Replaced by auth API |
| `js/data/orders.js` | Replaced by order/coupon API |

The entire `/js/data/` folder can be deleted once all three services are pointing at real endpoints.

---

## localStorage Keys

All keys are namespaced with the `voidwear_` prefix (set in `storage.js`).

| Key | Contents |
|---|---|
| `voidwear_cart` | `CartItem[]` — persists across sessions |
| `voidwear_wishlist` | `WishlistItem[]` — persists across sessions |
| `voidwear_auth_user` | Sanitised `User` object (no password) |
| `voidwear_mock_users` | Mock user registry (delete when using real auth) |
| `voidwear_orders` | Mock order registry (delete when using real orders) |

---

## Mock Coupon Codes (for testing)

| Code | Discount | Min Order |
|---|---|---|
| `VOID10` | 10% off | $50 |
| `DROP20` | 20% off | $150 |
| `FIRST15` | $15 off | $75 |
| `FREESHIP` | Free shipping | $0 |

---

## Browser Support

ES6 modules (`type="module"`) are supported natively in all modern browsers (Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+). No transpilation needed. If you need IE11 support, run the JS through Babel and bundle with Rollup or esbuild.

---

## Design Tokens

All colours, spacing, and typography are CSS custom properties in `css/main.css` under `:root`. To retheme the entire site, only these variables need changing:

```css
:root {
  --clr-bg:     #0a0a0a;   /* main background */
  --clr-accent: #b8f53a;   /* neon green — change to any brand colour */
  --clr-red:    #ff2d2d;   /* danger / sold-out */
  --font-display: 'Arial Black', sans-serif;  /* swap for any bold display font */
}
```
