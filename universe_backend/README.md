# Universe backend (Django + DRF)

Matches the API your React frontend already expects in `real/` mode
(snake_case requests, camelCase responses via the frontend's own conversion layer,
SimpleJWT-style tokens, DRF pagination).

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then fill in PAYSTACK_SECRET_KEY at minimum
python manage.py makemigrations accounts products orders payments
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API is now at `http://localhost:8000/api`. In your frontend `.env`:
```
VITE_API_MODE=real
VITE_API_URL=http://localhost:8000/api
```

By default the database is SQLite (`db.sqlite3`) — nothing else to install.
To use PostgreSQL instead, set `DATABASE_URL` in `.env`, e.g.
`postgres://user:password@localhost:5432/universe`, and keep `psycopg2-binary` installed.

## 2. What's here

| App | Responsibility |
|---|---|
| `accounts` | User model (buyer/seller), JWT auth, Google sign-in, password reset by email OTP, seller profile |
| `products` | Product CRUD, the 2-featured / 20-total seller limits |
| `orders` | Order creation — recomputes totals from the DB, checks stock, verifies `payment_reference` |
| `payments` | Paystack `initialize` / `verify` |
| `storefront` | Public `GET /storefront/{slug}` page |
| `uploads` | `POST /uploads/images` (multipart) |
| `core` | Shared error formatting, pagination shape, permissions |

## 3. Notes and things to double-check against your frontend

- **`APPEND_SLASH = False`** — your API client calls paths without a trailing slash
  (`/api/products`, not `/api/products/`). Don't add one when adding new routes.
- **Error shape**: every error responds `{ "message": ..., "code": ..., "field_errors": {...} }`
  (see `core/exceptions.py`). Confirm this matches what your `HttpClient` unwraps — I inferred
  it from the naming pattern in your API layer, but I didn't see the exact error-parsing code.
- **Pagination shape**: list endpoints return `{ "items": [...], "total", "page", "page_size" }`
  (see `core/pagination.py`). Check this against your `PaginatedResponse<T>` type.
- **No cart endpoints** — your frontend keeps the cart client-side, so orders are created in one
  shot from `POST /orders`.
- **Paystack webhook**: only client-driven `verify` is implemented. For production, also add a
  webhook endpoint (`POST /payments/webhook`) that listens for `charge.success` server-to-server,
  so a payment still gets recorded if the buyer closes the tab before returning. Ask me to add it
  once you're ready to deploy — it needs your Paystack webhook secret to verify the signature.
- **Image uploads** are stored locally under `/media`. Fine for development; for production, swap
  `uploads/views.py` for `django-storages` + S3 (or similar) — say the word and I'll wire it up.
- **`docs/API_CONTRACT.md`** was referenced in your code comments but wasn't in the files you sent —
  if you have it, send it and I'll reconcile any field names I had to guess (e.g. exact
  `field_errors` key names, the seller-profile response fields for logged-out visitors).

## 4. Suggested order to test

1. `POST /api/auth/register` (account_type: "seller") → `POST /api/auth/login`
2. `PATCH /api/users/me/seller-profile` → set a `store_name` (this generates the store `slug`)
3. `POST /api/products` (as that seller) → `GET /api/products`
4. `GET /api/storefront/{slug}` (public, no auth)
5. Register a second user as buyer → `POST /api/orders` with that product
6. `POST /api/payments/initialize` → complete on Paystack test card → `GET /api/payments/verify/{reference}`
