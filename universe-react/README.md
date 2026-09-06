# Universe — React Marketplace

A React 19 + Vite 8 marketplace application with a **complete mock/real API
integration architecture**. The frontend currently works against a realistic
in-browser mock API, and is designed so the real backend can be swapped in
later by changing **one environment variable** — no React code changes.

## Quick start

```bash
npm install
npm run dev
```

The app starts in **mock mode** by default (no backend required). Demo
credentials: `demo@universe.app` / `password123`.

## Switching to the real backend

```env
# .env
VITE_API_MODE=real
VITE_API_URL=http://localhost:8000/api
```

That is it. Every component, hook, and service keeps working unchanged because
the UI only ever talks to service interfaces — it never knows whether the data
comes from the mock or the real backend.

## Architecture

```
React Component
      |
      v
   Hook (useProducts, useAuth, ...)
      |
      v
   API Service (productsApi, authApi, usersApi
      |
      +-- VITE_API_MODE=mock  ->  Mock*Api  ->  Mock Database (localStorage)
      |
      +-- VITE_API_MODE=real  ->  HttpClient (fetch)  ->  Real Backend
```

### Key principles

- **Components never touch `localStorage` or `fetch()`** — only the API layer does.
- **Mock and real implementations share the same TypeScript interfaces**, so
  swapping is a config-only change.
- **TanStack Query** manages all server state (caching, loading, errors, retries).
- **Mock latency** (~300–800ms) exercises loading/error/empty states realistically.

## Project structure

```
src/
+-- api/
|   +-- config.ts              <- reads VITE_API_MODE / VITE_API_URL / VITE_MOCK_LATENCY
|   +-- errors.ts              <- ApiError class + error codes
|   +-- logger.ts              <- dev-only [API] request logging
|   +-- session.ts             <- token store (localStorage)
|   +-- types.ts               <- shared API contract types
|   +-- services/
|   |   +-- auth.ts            <- AuthApi interface + factory (mock/real)
|   |   +-- products.ts        <- ProductsApi interface + factory
|   |   +-- users.ts           <- UsersApi interface + factory
|   +-- mock/
|   |   +-- mockDatabase.ts    <- centralized localStorage-backed DB
|   |   +-- mockLatency.ts     <- artificial network delay
|   |   +-- seed.ts            <- demo users, products, orders, profiles
|   |   +-- auth.mock.ts       <- MockAuthApi
|   |   +-- products.mock.ts   <- MockProductsApi
|   |   +-- users.mock.ts      <- MockUsersApi
|   +-- real/
|       +-- client.ts          <- centralized fetch-based HTTP client
|       +-- auth.api.ts        <- RealAuthApi
|       +-- products.api.ts    <- RealProductsApi
|       +-- users.api.ts       <- RealUsersApi
+-- hooks/
|   +-- useAuth.ts             <- useLogin, useRegister, useLogout, useCurrentUser
|   +-- useProducts.ts         <- useProducts, useProduct, useCreateProduct, ...
|   +-- useUser.ts             <- useSellerProfile, useUpdateSellerProfile, ...
+-- types/index.ts             <- re-exports of API types
```

## API contract

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for the full endpoint spec.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Authenticate |
| POST | /auth/logout | Yes | Invalidate session |
| GET | /auth/me | Yes | Current user |
| POST | /auth/refresh | No | Refresh tokens |
| GET | /products | No | List (filterable) |
| GET | /products/:id | No | Single product |
| POST | /products | Yes | Create |
| PATCH | /products/:id | Yes | Update |
| DELETE | /products/:id | Yes | Delete |
| GET | /users/me/seller-profile | Yes | Seller profile |
| PATCH | /users/me/seller-profile | Yes | Update profile |
| PATCH | /users/me | Yes | Update account |

## How to switch from mock to real

1. Set `VITE_API_MODE=real` and `VITE_API_URL=...` in `.env`.
2. Implement the endpoints in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
3. Restart the dev server. **No React code changes needed.**