# API Contract

This document describes the backend API contract. The **mock API** implements
this exact contract today, so the real backend can be built against it and
swapped in later by setting `VITE_API_MODE=real` — no React code changes.

## Switching to the real backend

```env
VITE_API_MODE=real
VITE_API_URL=https://your-backend.com/api
```

The real adapter is designed for Django REST Framework. It sends JSON request
keys as `snake_case`, accepts DRF's `count`/`results` pagination and validation
error dictionaries, and sends `credentials: include` with a `csrftoken`
cookie as `X-CSRFToken`. JWT access tokens still use the `Authorization:
Bearer ...` header. The backend can return either the contract's camelCase
keys or normal Django snake_case keys.

No React component, hook, or service code needs to change. The mock and real
implementations both satisfy the same TypeScript interfaces.

## Base URL

```
VITE_API_URL (default: http://localhost:8000/api)
```

## Conventions

- All JSON requests/responses use `Content-Type: application/json`.
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Timestamps are ISO-8601 strings.
- Errors use the shape `{ message, code, fieldErrors? }`.

## Error shape

```ts
interface ApiError {
  message: string;        // Human-readable
  code: string;           // Machine-readable, e.g. "VALIDATION_ERROR"
  fieldErrors?: Record<string, string>; // Per-field validation messages
}
```

## Status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No content |
| 400 | Bad request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 422 | Validation error |
| 500 | Server error |

---

## Auth

### POST /auth/register
Create a new account. Public.

**Request**
```ts
{ fullName: string, email: string, password: string, accountType: "buyer" | "seller" }
```

**Response 200**
```ts
{ user: User, tokens: { accessToken: string, refreshToken: string } }
```

**Errors**
- 422 `VALIDATION_ERROR` — missing/invalid fields
- 409 `EMAIL_TAKEN` — email already registered

---

### POST /auth/login
Authenticate. Public.

**Request**
```ts
{ email: string, password: string, rememberMe?: boolean }
```

**Response 200**
```ts
{ user: User, tokens: { accessToken: string, refreshToken: string } }
```

**Errors**
- 422 `VALIDATION_ERROR` — missing fields
- 401 `INVALID_CREDENTIALS` — wrong email/password

---

### POST /auth/google
Authenticate OR sign up with Google. Public.

The frontend sends the **Google ID token (JWT)** it obtained from Google
Identity Services (the real "Continue with Google" button):

**Request**
```ts
{ credential: string, rememberMe?: boolean }
```

The backend MUST verify the token server-side before trusting it:

- signature against Google's public keys (JWKS at
  `https://www.googleapis.com/oauth2/v3/certs`),
- `aud` contains this app's OAuth client ID,
- `iss` is `https://accounts.google.com` (or `accounts.google.com`),
- `exp` has not passed (small clock-skew allowance),
- `email_verified` is true.

It then reads the standard claims (`email`, `name`, `given_name`,
`family_name`, `picture`).

The **mock backend** implements the exact same flow minus the signature
check (it has no Google keys): it decodes the payload and validates the
claims above — so switching to the real backend adds verification only.

**Response 200**
```ts
{ user: User, tokens: { accessToken: string, refreshToken: string }, isNewUser?: boolean }
```

Behavior:
- **Email already registered** → the *existing* user is authenticated. No
  duplicate account is ever created (account linking); only a missing
  `avatarUrl` may be backfilled from the Google picture.
- **Unknown email** → a new user is created following the existing user schema
  (`fullName` from `name`, `avatarUrl` from `picture`,
  `authProvider: "google"`) and `isNewUser: true` is returned. Google accounts
  have no password, so email/password login can never succeed for them.

**Errors**
- 422 `VALIDATION_ERROR` — credential missing/malformed or has no usable email
- 401 `UNAUTHORIZED` — token expired, audience mismatch, or untrusted issuer
- 403 `FORBIDDEN` — Google email not verified, or account suspended

---

### POST /auth/logout
Invalidate the current session. Protected.

**Response 204**

---

### GET /auth/me
Get the currently authenticated user. Protected.

**Response 200**
```ts
User
```

**Errors**
- 401 `UNAUTHORIZED` — no valid session

---

### POST /auth/refresh
Refresh the access token. Public (uses refresh token).

**Request**
```ts
{ refreshToken: string }
```

**Response 200**
```ts
{ accessToken: string, refreshToken: string }
```

**Errors**
- 401 `UNAUTHORIZED` — invalid refresh token

---

## Users / Seller Profile

## Public Storefront

### GET /storefront/:slug
Resolve a seller's private marketplace. This endpoint is public: visitors do
not need an account or an authorization token to view a seller storefront.

**Response 200**
```ts
Storefront
```

**Errors**
- 404 `NOT_FOUND` — no seller storefront matches the slug in the real backend

### GET /users/:userId/seller-profile
The seller's PUBLIC profile. Like the storefront, this endpoint is public:
visitors do not need an account or an authorization token. It is what the public
seller profile page reads when a buyer taps **View seller profile** on a product
page (`/marketplace/seller-profile/:sellerSlug`).

**Response 200**
```ts
PublicSellerProfile
```

**Rules**
- Return only fields the seller actually PUBLISHED; omit (or `null`) the rest.
  The UI drops missing rows instead of inventing a placeholder.
- `name` is the store name, falling back to the account name.
- A buyer id or an unknown id is a real 404 — never an empty profile, so the UI
  can show "seller not found".

**Errors**
- 404 `NOT_FOUND` — no seller account with that id

### GET /users/me/seller-profile
Get the current user's seller profile. Protected.

**Response 200**
```ts
SellerProfile
```

---

### PATCH /users/me/seller-profile
Update the seller profile. Protected.

**Request**
```ts
{ storeName?, phone?, level?, department?, course?, school?, bio?, logoUrl?, bannerUrl? }
```

**Response 200**
```ts
SellerProfile
```

---

### PATCH /users/me
Update the current user's account. Protected.

**Request**
```ts
{ fullName?, phone?, avatarUrl? }
```

Only these fields are accepted — email, password, accountType and status can
NEVER be changed through this endpoint (mass-assignment protection).

**Response 200**
```ts
User
```

---

### PATCH /users/me/password
Change the password. Protected.

**Request**
```ts
{ currentPassword: string, newPassword: string }
```

- Verifies `currentPassword` (401 `INVALID_CURRENT_PASSWORD` when wrong).
- Enforces the password policy: 8+ chars, at least one letter and one number,
  common passwords blocked (422 `WEAK_PASSWORD`).
- Revokes every OTHER session of the user; the current device stays signed in.

**Response 204**

---

### POST /users/me/email
Change the email address. Protected.

**Request**
```ts
{ currentPassword: string, newEmail: string }
```

**Response 200**
```ts
User
```

**Errors**
- 401 `INVALID_CURRENT_PASSWORD`
- 409 `EMAIL_TAKEN`
- 422 `VALIDATION_ERROR`

---

### DELETE /users/me
Permanently delete the account. Protected.

**Request**
```ts
{ currentPassword: string }
```

Cascade-deletes the user's products, seller profile and every session, then
the user itself. **Response 204**

---

## Security model

- **Passwords** are hashed with PBKDF2-HMAC-SHA256 (120k iterations, per-user
  random salt). Plaintext passwords are never stored or logged.
- **Sessions** consist of a short-lived access token (24h) and a refresh token
  (30 days, or 12h when "remember me" is unchecked). Tokens are 256-bit CSPRNG
  values and are stored server-side only as SHA-256 hashes.
- **Refresh rotation**: every refresh invalidates the previous token pair.
- **Brute-force lockout**: 5 consecutive failed logins (or failed password
  confirmations) lock the account for 15 minutes (429 `RATE_LIMITED`).
- **No account enumeration**: login always returns `Invalid email or
  password.`; non-owned product ids return 404 instead of 403.
- **Ownership**: products can only be mutated by their owner; drafts are
  private to their owner; the public catalog only exposes active products.

---

## Products

### GET /products
List products. Public, with **automatic scoping**:

- No `sellerId` → the public catalog: only **active** products of all sellers.
- `sellerId` = your own id → your private workshop view: **all statuses**
  (active + drafts).
- `sellerId` = someone else's id → that seller's **active** products only.

Also supports `status`, `category`, `search`, `page`, `pageSize`.

Listings are returned **newest first** (by `createdAt`, descending). This is
part of the contract, not a nicety: the marketplace renders one page at a time,
so a brand-new product appended behind older rows would fall off page one and
never be seen. The frontend pages through with explicit "Load more" requests —
`total` tells it whether another page exists.

**Response 200**
```ts
{ items: Product[], total: number, page: number, pageSize: number }
```

---

### GET /products/:id
Get a single product. Public.

**Response 200**
```ts
Product
```

**Errors**
- 404 `NOT_FOUND`

---

### POST /products
Create a product. Protected.

**Request**
```ts
{ name, description?, price, salePrice?, stock?, sku?, category?, status?, imageUrl?, imageAlt?, images?, variants?, featuredInMarketplace? }
```
Only products the seller opts into (`featuredInMarketplace: true`) are listed in the shared public marketplace — at most **2** active products per seller. The field defaults to `false`.

**Response 200 / 201**
```ts
Product
```

**Errors**
- 422 `VALIDATION_ERROR`
- 422 `MARKETPLACE_LIMIT_REACHED` (when opting in would exceed the above cap)

---

### PATCH /products/:id
Update a product. Protected.

**Request**
```ts
Partial<CreateProductRequest>
```

**Response 200**
```ts
Product
```

**Errors**
- 404 `NOT_FOUND`
- 422 `VALIDATION_ERROR`

---

### DELETE /products/:id
Delete a product. Protected.

**Response 204**

**Errors**
- 404 `NOT_FOUND`

---

## Type reference

```ts
interface User {
  id: string; email: string; fullName: string;
  accountType: "buyer" | "seller"; avatarUrl?: string | null;
  authProvider?: "password" | "google";
  status: "active" | "suspended"; createdAt: string; updatedAt: string;
}

interface SellerProfile {
  id: string; userId: string; storeName?: string; phone?: string;
  level?: string; department?: string; course?: string; school?: string; bio?: string;
  logoUrl?: string | null; bannerUrl?: string | null;
}

/**
 * The seller's PUBLIC profile (GET /users/:userId/seller-profile) — only the
 * fields the seller published. Absent fields are omitted; `name` is the store
 * name with the account name as fallback.
 */
interface PublicSellerProfile {
  userId: string; name: string; email?: string | null; phone?: string | null;
  level?: string | null; department?: string | null; course?: string | null;
  school?: string | null; bio?: string | null; logoUrl?: string | null;
}

/** A product option group ("variant") — e.g. Size → Small / Medium / Large. */
interface ProductVariant {
  name: string;      // option name, e.g. "Size" (unique per product, ≤40 chars)
  values: string[];  // selectable values, e.g. ["Small","Medium"] (1–20, each ≤40 chars)
}

interface Product {
  id: string; sellerId: string; seller?: string | null;
  /** Seller phone in a WhatsApp-compatible format for buyer inquiries. */
  sellerPhone?: string | null;
  name: string; description?: string | null; price: number;
  salePrice?: number | null; stock?: number | null; sku?: string;
  category?: string; status: "active" | "draft";
  /** Seller-attested condition: "new" (Brand New) or "used" (Fairly Used).
   *  Null when the backend has no data — the UI shows "Condition unavailable". */
  condition?: "new" | "used" | null;
  imageUrl?: string | null; imageAlt?: string | null;
  images?: string[] | null; // up to 5 gallery images; images[0] is the cover
  variants?: ProductVariant[] | null; // up to 10 option groups; null/[] = no variants
  /** Delivery hub the product is collected from. The Add Product page always
   *  sends DEFAULT_DELIVERY_LOCATION ("Motion Ground At DHL Building") — the
   *  seller does not type a location; the public marketplace shows this value
   *  on the product card and the product page. Null/omitted = the platform
   *  default is displayed. */
  deliveryLocation?: string | null;
  /** Listed in the shared public marketplace catalog (seller opts in). At most
   *  MARKETPLACE_LISTING_LIMIT (2) active products per seller. */
  featuredInMarketplace?: boolean | null;
  rating: number; reviews: number; createdAt: string; updatedAt: string;
}
```

---

## Frontend adapter status and assumptions

This is a **frontend contract**, not backend integration evidence. No endpoint
below has been verified against a running Django/DRF service. The real adapters
must be tested against the response shapes documented here before release.

The frontend accepts one narrow set of compatibility forms: camelCase or
snake_case keys, numeric strings for numeric fields, a documented `{ data: ... }`
envelope, and DRF `{ count, results }` pagination. The canonical backend form
should be the camelCase contract shape with no envelope unless an endpoint below
explicitly documents one. Unknown fields and unknown error codes are ignored
for UI decisions.

## Storefront

### GET `/storefront/:slug`

- **Authentication:** public; no bearer token required.
- **Parameters:** path `slug` (URL encoded).
- **Body:** none.
- **Response:** `Storefront`, optionally including `products: StorefrontProduct[]`.
  `sellerId` is required when products are not embedded so the UI can make a
  separate paginated `GET /products?sellerId=...` request.
- **Pagination:** embedded products are not pagination; a separate product
  request is required for a large catalog.
- **Status codes:** 200, 404 `NOT_FOUND`, 429, 500+.
- **Example:** `GET /storefront/globalstore` -> `{ "slug": "globalstore", "name": "Global Store", "products": [] }`.

All seller metrics, badges, assurances, prices, availability, reviews and
promotions are backend-owned. Missing values are `null`, empty arrays, or
omitted. The frontend derives only display labels, image alt text, a formatted
price label, and a WhatsApp URL from a supplied phone number.

## Payments

### POST `/payments/initialize`

- **Authentication:** required.
- **Body:** `{ amount, email, currency?, metadata? }` where amount is major
  currency units.
- **Response:** `{ authorizationUrl, reference, status: "success" | "failed" }`.
- **Pagination:** none.
- **Status codes:** 200/201, 400/422 validation, 401, 403, 409, 429, 500+.
- **Example:** `{ "amount": 309985, "email": "buyer@example.com" }` ->
  `{ "authorization_url": "https://checkout.paystack.com/...", "reference": "PS-123", "status": "success" }`.

### GET `/payments/verify/:reference`

- **Authentication:** required.
- **Parameters:** path `reference`.
- **Response:** `{ reference, status: "success" | "failed" | "pending", amount?, currency?, transactionId?, paidAt?, orderId? }`.
- **Pagination:** none.
- **Status codes:** 200, 401, 403, 404, 409, 429, 500+.

The real adapter reports payment success only when the backend returns
`status: "success"`; redirect completion or the presence of a reference is not
success.

## Orders

### GET `/orders` and GET `/orders/:id`

- **Authentication:** required; buyers receive only their own orders.
- **Parameters:** list query `page`, `pageSize`; detail path `id`.
- **Response:** list `{ items, total, page, pageSize }` or DRF `{ count, results }`;
  detail `Order`.
- **Pagination:** server-side; the frontend does not aggregate automatically.
- **Status codes:** 200, 401, 403, 404, 429, 500+.

### POST `/orders`

- **Authentication:** required.
- **Body:** `{ items: [{ productId, quantity, variantSelection?, unitPrice? }], deliveryAddress, paymentReference?, note? }`.
- **Response:** the authoritative created `Order`; a 2xx with no order is an
  adapter error and is never treated as success.
- **Pagination:** none.
- **Status codes:** 201/200, 400/422 validation, 401, 403, 404, 409, 429, 500+.

### GET `/seller/orders`

- **Authentication:** required; seller accounts only (buyers get 403).
- **Purpose:** the data source for Sales Analytics. Returns every order that
  contains at least one line item of a product owned by the authenticated
  seller, newest first.
- **Parameters:** `page`, `pageSize`, and optional `since` / `until` (ISO 8601
  timestamps bounding `createdAt`, inclusive).
- **Response:** the same list envelope as `GET /orders` (`{ items, total, page,
  pageSize }` or DRF `{ count, results }`). Every returned order MUST include
  its line items — `items: [{ productId, productName, quantity, unitPrice,
  lineTotal, sellerId }]` — where `unitPrice`/`lineTotal` are the amounts
  actually charged and `sellerId` attributes the line to the seller that owns
  the product, so multi-seller orders stay attributable per line.
- **Pagination:** server-side; the frontend pages through until `total` is
  covered.
- **Status codes:** 200, 401, 403, 429, 500+.

Sales Analytics computes its figures client-side from this endpoint — revenue,
orders, units sold, refunds and the revenue chart are aggregated over the
selected window and again over the immediately previous window of the same
length (for the "vs last period" trends). The Django app therefore only needs
faithful order records here; no analytics endpoint is required. When line
items are absent the frontend falls back to each order's `total`, so a Django
serializer that always includes `items` keeps the numbers exact.

## Uploads

### POST `/uploads/images`

- **Authentication:** required.
- **Body:** multipart/form-data with file field `image`; do not require the
  caller to set the multipart boundary.
- **Response:** `{ url, name?, size? }`; `url` is required to confirm success.
- **Pagination:** none.
- **Status codes:** 201/200, 400/422 invalid type or size, 401, 403, 413, 429, 500+.

## Error format

The preferred body is `{ message, code, fieldErrors? }`. DRF validation bodies
such as `{ "email": ["Already exists"] }` and `non_field_errors` are mapped to
camelCase frontend field names. The frontend preserves the HTTP status and the
raw backend code as `backendCode`; an unrecognized code becomes
`UNKNOWN_ERROR`. The stable frontend codes include `VALIDATION_ERROR`,
`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`,
`SERVER_ERROR`, `MARKETPLACE_LIMIT_REACHED`, and `UNKNOWN_ERROR`.

## Contract examples

Canonical protected request:

```http
GET /products?page=1&pageSize=24&search=headphones
Authorization: Bearer <accessToken>
Accept: application/json
```

Canonical validation error:

```json
{
  "message": "Please correct the highlighted fields.",
  "code": "VALIDATION_ERROR",
  "fieldErrors": { "email": "Enter a valid email" }
}
```

The mock API may simulate latency, payment completion, and local persistence
for development. Those behaviors are isolated to `src/api/mock`; the real
adapters never echo submitted data as a successful server response and never
fabricate payment, order, catalog, seller, or review data.
