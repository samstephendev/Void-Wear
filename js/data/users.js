/**
 * /js/data/users.js
 * ─────────────────────────────────────────────────────────────
 * Mock user records for authentication simulation.
 * BACKEND SWAP: Delete this file. In authService.js replace all
 * references to MOCK_USERS with real API calls to your auth
 * endpoints (POST /auth/login, POST /auth/signup, etc.).
 * ─────────────────────────────────────────────────────────────
 *
 * User shape:
 * {
 *   id        : string
 *   email     : string
 *   password  : string   ← PLAIN TEXT — only acceptable for mock/demo
 *   firstName : string
 *   lastName  : string
 *   avatar    : string   ← initials or URL
 *   createdAt : string   ← ISO date
 *   addresses : Address[]
 *   wishlist  : string[] ← product IDs
 * }
 *
 * Address shape:
 * {
 *   id         : string
 *   label      : string  ← e.g. "Home", "Work"
 *   firstName  : string
 *   lastName   : string
 *   line1      : string
 *   line2?     : string
 *   city       : string
 *   state      : string
 *   zip        : string
 *   country    : string
 *   isDefault  : boolean
 * }
 */

export const MOCK_USERS = [
  {
    id: 'usr_001',
    email: 'demo@voidwear.com',
    password: 'demo1234',
    firstName: 'Alex',
    lastName: 'Void',
    avatar: 'AV',
    createdAt: '2026-01-15T00:00:00Z',
    addresses: [
      {
        id: 'addr_001',
        label: 'Home',
        firstName: 'Alex',
        lastName: 'Void',
        line1: '420 Graffiti Alley',
        line2: 'Apt 7',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'US',
        isDefault: true,
      },
    ],
    wishlist: ['void-runner', 'limited-drop-tee'],
  },
  {
    id: 'usr_002',
    email: 'test@test.com',
    password: 'test1234',
    firstName: 'Jordan',
    lastName: 'Lee',
    avatar: 'JL',
    createdAt: '2026-03-20T00:00:00Z',
    addresses: [],
    wishlist: [],
  },
];
