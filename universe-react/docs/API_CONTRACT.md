# API Contract

This document describes the backend API contract. The **mock API** implements
this exact contract today, so the real backend can be built against it and
swapped in later by setting `VITE_API_MODE=real` — no React code changes.

## Switching to the real backend

```env
VITE_API_MODE=real
VITE_API_URL=https://your-backend.com/api
```

No React component, hook, or service code needs to change. The mock and real
implementations both satisfy the same TypeScript interfaces.

## Base URL

```
VITE_API_URL (default: http://localhost:8000/api)
```

## Conventions

- All requests/responses are JSON (`Content-Type: application/json`).
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
{ name, description?, price, salePrice?, stock?, sku?, category?, status?, imageUrl?, imageAlt?, images? }
```

**Response 200 / 201**
```ts
Product
```

**Errors**
- 422 `VALIDATION_ERROR`

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

interface Product {
  id: string; sellerId: string; seller?: string | null;
  name: string; description?: string | null; price: number;
  salePrice?: number | null; stock?: number | null; sku?: string;
  category?: string; status: "active" | "draft";
  imageUrl?: string | null; imageAlt?: string | null;
  images?: string[] | null; // up to 5 gallery images; images[0] is the cover
  rating: number; reviews: number; createdAt: string; updatedAt: string;
}
```
