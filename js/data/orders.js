/**
 * /js/data/orders.js
 * ─────────────────────────────────────────────────────────────
 * Mock order history, seeded to user usr_001.
 * BACKEND SWAP: Delete this file. In orderService.js replace all
 * references to MOCK_ORDERS with real API calls (GET /orders,
 * POST /orders, GET /orders/:id).
 * ─────────────────────────────────────────────────────────────
 *
 * Order shape:
 * {
 *   id           : string
 *   userId       : string
 *   status       : 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
 *   items        : OrderItem[]
 *   shippingAddress : Address
 *   paymentMethod: string
 *   subtotal     : number
 *   shipping     : number
 *   tax          : number
 *   discount     : number
 *   total        : number
 *   couponCode?  : string
 *   createdAt    : string  ← ISO date
 *   updatedAt    : string
 *   trackingNumber?: string
 *   estimatedDelivery?: string
 * }
 *
 * OrderItem shape:
 * {
 *   productId : string
 *   name      : string
 *   image     : string
 *   color     : string
 *   size      : string
 *   price     : number
 *   quantity  : number
 * }
 */

export const MOCK_ORDERS = [
  {
    id: 'ORD-2026-0042',
    userId: 'usr_001',
    status: 'delivered',
    items: [
      {
        productId: 'void-logo-tee',
        name: 'VOID LOGO HEAVYWEIGHT TEE',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80',
        color: 'Black',
        size: 'L',
        price: 55,
        quantity: 2,
      },
      {
        productId: 'void-beanie',
        name: 'VOID RIBBED BEANIE',
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=200&q=80',
        color: 'Black',
        size: 'ONE SIZE',
        price: 38,
        quantity: 1,
      },
    ],
    shippingAddress: {
      firstName: 'Alex',
      lastName: 'Void',
      line1: '420 Graffiti Alley',
      line2: 'Apt 7',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'US',
    },
    paymentMethod: 'card',
    subtotal: 148,
    shipping: 0,
    tax: 12.95,
    discount: 0,
    total: 160.95,
    couponCode: null,
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '2026-08-16T09:00:00Z',
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: '2026-08-16',
  },
  {
    id: 'ORD-2026-0031',
    userId: 'usr_001',
    status: 'shipped',
    items: [
      {
        productId: 'cargo-tech-pant',
        name: 'TECH CARGO PANTS',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&q=80',
        color: 'Black',
        size: '32',
        price: 185,
        quantity: 1,
      },
    ],
    shippingAddress: {
      firstName: 'Alex',
      lastName: 'Void',
      line1: '420 Graffiti Alley',
      line2: 'Apt 7',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'US',
    },
    paymentMethod: 'card',
    subtotal: 185,
    shipping: 9.99,
    tax: 17.10,
    discount: 18.50,
    total: 193.59,
    couponCode: 'VOID10',
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-11T08:30:00Z',
    trackingNumber: '1Z999AA10123456790',
    estimatedDelivery: '2026-09-18',
  },
  {
    id: 'ORD-2026-0019',
    userId: 'usr_001',
    status: 'delivered',
    items: [
      {
        productId: 'void-runner',
        name: 'VOID RUNNER 001',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
        color: 'Triple Black',
        size: '10',
        price: 245,
        quantity: 1,
      },
      {
        productId: 'arch-cap',
        name: 'ARCH 6-PANEL CAP',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&q=80',
        color: 'Black',
        size: 'ONE SIZE',
        price: 48,
        quantity: 1,
      },
    ],
    shippingAddress: {
      firstName: 'Alex',
      lastName: 'Void',
      line1: '420 Graffiti Alley',
      line2: 'Apt 7',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'US',
    },
    paymentMethod: 'paypal',
    subtotal: 293,
    shipping: 0,
    tax: 25.64,
    discount: 0,
    total: 318.64,
    couponCode: null,
    createdAt: '2026-07-01T09:15:00Z',
    updatedAt: '2026-07-05T14:00:00Z',
    trackingNumber: '1Z999AA10123456765',
    estimatedDelivery: '2026-07-05',
  },
];

/**
 * Mock coupon codes.
 * BACKEND SWAP: Remove this and validate coupons via POST /coupons/validate.
 *
 * Coupon shape:
 * { code, type: 'percent'|'fixed', value, minOrder }
 */
export const MOCK_COUPONS = [
  { code: 'VOID10',   type: 'percent', value: 10, minOrder: 50 },
  { code: 'DROP20',   type: 'percent', value: 20, minOrder: 150 },
  { code: 'FREESHIP', type: 'shipping', value: 0, minOrder: 0 },
  { code: 'FIRST15',  type: 'fixed',   value: 15, minOrder: 75 },
];
