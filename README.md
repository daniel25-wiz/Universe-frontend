# Universe — E-Commerce Marketplace Platform

<div align="center">

<img src="\universe-react\public\logo.png" alt="Universe logo" width="120" />

**A full-featured, production-ready marketplace platform built with React 19, Vite 8, and a mock-to-real API architecture**

[![React](https://img.shields.io/badge/React-19.2.7-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1.1-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.102.8-ff4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](#) · [Documentation](docs/API_CONTRACT.md) · [Contributing](#contributing) · [License](#license)

</div>

---

<h2 id="toc"><img src="https://api.iconify.design/octicon/list-unordered-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Table of Contents</h2>

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Architecture](#project-architecture)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [API Contract](#api-contract)
- [Authentication & Security](#authentication--security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

<h2 id="overview"><img src="https://api.iconify.design/octicon/info-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Overview</h2>

**Universe** is a full-stack e-commerce marketplace platform built for scalability and a smooth developer experience. It ships with both **buyer** and **seller** experiences out of the box — a public storefront, a seller dashboard with real-time analytics, and WhatsApp-based checkout for direct buyer–seller communication.

The idea at the center of Universe is its **mock-to-real API architecture**: the entire frontend runs against a localStorage-backed mock API that mirrors real network behavior, so you can build and test the whole product before a backend even exists. Flip one environment variable and it talks to your real API instead — no code changes required.

A few other things worth knowing:

| | |
|---|---|
| **Production-ready UI** | Loading skeletons, error boundaries, and optimistic updates throughout |
| **Security-first** | Token-based auth, CSRF protection, rate limiting, and brute-force protection |
| **Seller analytics** | Real-time sales tracking, revenue charts, and performance metrics |
| **Multi-vendor** | Every seller gets their own customizable storefront |

---

<h2 id="key-features"><img src="https://api.iconify.design/octicon/star-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Key Features</h2>

### For Buyers
- **Public Marketplace** — browse products from multiple sellers
- **Advanced Search & Filtering** — find products by category, price, seller, and more
- **Wishlist Management** — save favorite items for later
- **Smart Shopping Cart** — persistent cart across sessions with variant support
- **WhatsApp Checkout** — contact sellers directly via WhatsApp
- **Order History** — track all purchases in one place
- **Buyer Profile** — `/account` page with editable name (saved via `PATCH /users/me`), activity stats (saved products, products ordered, items in cart), and integrated support contacts (phone, email, WhatsApp)
- **Google Sign-In** — one-click authentication with Google OAuth

### For Sellers
- **Analytics Dashboard** — revenue tracking, sales trends, and performance metrics
- **Product Management** — create, edit, and manage up to 20 products per workshop
- **Workshop Product Limit** — each seller can store at most **20 products** (active + drafts combined) in their workshop; the UI and the products API both enforce the cap (422 `WORKSHOP_LIMIT_REACHED`)
- **Multi-Image Gallery** — upload up to 5 images per product
- **Product Variants** — define size, color, or custom options (up to 10 variant groups)
- **Sales Analytics** — real-time insights with comparison to previous periods
- **Seller Profile** — customizable store information and branding
- **Featured Products** — showcase up to 2 products in the public marketplace
- **Account Settings** — manage profile, password, and account preferences

### Platform Features
- **Dual Authentication** — email/password and Google OAuth 2.0
- **Responsive Design** — mobile-first, works on all devices
- **Boot Skeletons** — instant perceived performance with CSS-only loading states
- **Accessibility** — WCAG 2.1 compliant with keyboard navigation
- **Code Splitting** — route-based lazy loading for optimal performance
- **Offline-First** — cart and saved items persist in localStorage
- **Optimistic Updates** — instant UI feedback before server confirmation
- **Error Boundaries** — graceful error handling throughout the app

---

<h2 id="tech-stack"><img src="https://api.iconify.design/octicon/stack-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Tech Stack</h2>

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.7 | UI framework with concurrent features |
| **Vite** | 8.1.1 | Lightning-fast build tool and dev server |
| **TypeScript** | 7.0.2 | Type safety and improved DX |
| **React Router** | 7.18.2 | Client-side routing with data loading |
| **TanStack Query** | 5.102.8 | Server state management, caching, and synchronization |
| **OxLint** | 1.71.0 | Fast JavaScript/TypeScript linter |

### Backend (Ready for Integration)
The frontend is designed to work with any backend framework. The mock API demonstrates the expected contract for:

- **Django + DRF** (recommended, real adapters are DRF-optimized)

### Recommended Backend Stack
- **Django 5.2+** with Django REST Framework
- **PostgreSQL 18+** for database
- **Redis** for session management and caching
- **Celery** for background tasks
- **AWS S3** or **Cloudinary** for image uploads
- **Paystack** or **Stripe** for payment processing

---

<h2 id="quick-start"><img src="https://api.iconify.design/octicon/rocket-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Quick Start</h2>

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher (or **pnpm**, **yarn**)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/universe-react.git
cd universe-react

# Install dependencies
npm install

# Copy environment configuration
copy .env.example .env

# Start development server
npm run dev
```

The app will open at `http://localhost:5173` in **mock mode** (no backend required).

### Demo Credentials
```
Email: demo@universe.app
Password: password123
Account Type: Seller (full dashboard access)
```

Additional test accounts available in `src/api/mock/seed.ts`.

---

<h2 id="project-architecture"><img src="https://api.iconify.design/octicon/package-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Project Architecture</h2>

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Components  │  │    Hooks     │  │    Pages     │       │
│  │  (UI Layer)  │  │  (Business   │  │   (Routes)   │       │
│  │              │  │    Logic)    │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │  API Services   │                         │
│                  │  (Abstraction)  │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│          ┌────────────────┴────────────────┐                │
│          │                                  │                │
│   ┌──────▼───────┐                 ┌───────▼──────┐         │
│   │  Mock API    │                 │   Real API   │         │
│   │ (localStorage)│                │  (HTTP/REST) │         │
│   └──────────────┘                 └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │  Backend Server       │
               │  (Django/Express/etc) │
               └───────────────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │   Database            │
               │   (PostgreSQL/MySQL)  │
               └───────────────────────┘
```

### Directory Structure

```
universe-react/
├── public/                          # Static assets
│   ├── logoicon.png                 # App logo
│   ├── icons.svg                    # SVG sprite icons
│   ├── marketplace-banners/         # Marketing banners
│   └── static/                      # Legacy static files
│
├── src/
│   ├── api/                         # API layer (mock + real)
│   │   ├── config.ts                # Environment configuration
│   │   ├── errors.ts                # Error classes and codes
│   │   ├── logger.ts                # API request logging
│   │   ├── session.ts               # Token management
│   │   ├── types.ts                 # TypeScript interfaces
│   │   │
│   │   ├── services/                # Service interfaces (contract)
│   │   │   ├── auth.ts              # Authentication service
│   │   │   ├── products.ts          # Products service
│   │   │   ├── users.ts             # Users service
│   │   │   ├── orders.ts            # Orders service
│   │   │   ├── payments.ts          # Payments service
│   │   │   ├── storefront.ts        # Storefront service
│   │   │   └── uploads.ts           # File uploads service
│   │   │
│   │   ├── mock/                    # Mock API implementation
│   │   │   ├── mockDatabase.ts      # localStorage database
│   │   │   ├── mockLatency.ts       # Simulated network delay
│   │   │   ├── seed.ts              # Demo data
│   │   │   ├── security.ts          # Password hashing, rate limiting
│   │   │   ├── sessionGuard.ts      # Token validation
│   │   │   ├── googleIdToken.ts     # Google OAuth token validation
│   │   │   ├── auth.mock.ts         # Auth endpoints
│   │   │   ├── products.mock.ts     # Products endpoints
│   │   │   ├── users.mock.ts        # Users endpoints
│   │   │   ├── orders.mock.ts       # Orders endpoints
│   │   │   ├── payments.mock.ts     # Payments endpoints
│   │   │   ├── storefront.mock.ts   # Storefront endpoints
│   │   │   └── uploads.mock.ts      # Upload endpoints
│   │   │
│   │   ├── real/                    # Real API implementation
│   │   │   ├── client.ts            # HTTP client (fetch wrapper)
│   │   │   ├── auth.api.ts          # Auth API calls
│   │   │   ├── products.api.ts      # Products API calls
│   │   │   ├── users.api.ts         # Users API calls
│   │   │   ├── orders.api.ts        # Orders API calls
│   │   │   ├── payments.api.ts      # Payments API calls
│   │   │   ├── storefront.api.ts    # Storefront API calls
│   │   │   └── uploads.api.ts       # Upload API calls
│   │   │
│   │   └── normalize/                # Data normalization
│   │       ├── index.ts              # Main normalizer
│   │       ├── primitives.ts         # String/number normalization
│   │       ├── product.ts            # Product normalization
│   │       └── user.ts               # User normalization
│   │
│   ├── components/                   # React components
│   │   ├── auth/                     # Authentication UI
│   │   │   ├── AuthPage.jsx          # Login/signup page
│   │   │   ├── RequireAuth.jsx       # Protected route wrapper
│   │   │   └── GoogleSignInButton.jsx
│   │   │
│   │   ├── marketplace/              # Public marketplace
│   │   │   ├── MarketplaceProductPage.jsx
│   │   │   ├── SellerShopPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── SavedItemsPage.jsx
│   │   │   ├── MarketplaceSearchPage.jsx
│   │   │   ├── BuyerProfile.jsx      # Buyer profile page (/account)
│   │   │   ├── buyer-profile.css     # Buyer profile styles
│   │   │   └── MobileMarketplaceShell.jsx
│   │   │
│   │   ├── seller-dashboard/         # Seller dashboard
│   │   │   ├── SellerDashboard.jsx   # Dashboard shell
│   │   │   ├── DashboardView.jsx     # View wrapper
│   │   │   ├── views/                # Dashboard pages
│   │   │   │   ├── DashboardOverview.jsx
│   │   │   │   ├── MyMarketplace.jsx
│   │   │   │   ├── PublicMarketplace.jsx
│   │   │   │   ├── SalesAnalytics.jsx
│   │   │   │   ├── SellerProfile.jsx
│   │   │   │   └── SellerSettings.jsx
│   │   │   └── ui/                   # Dashboard UI components
│   │   │       ├── AddProductPage.jsx
│   │   │       └── EditProductPage.jsx
│   │   │
│   │   ├── seller-onboarding/        # Seller onboarding flow
│   │   └── skeletons/                # Loading skeletons
│   │       ├── HomeSkeleton.jsx
│   │       ├── AuthSkeleton.jsx
│   │       └── DashboardSkeleton.jsx
│   │
│   ├── hooks/                        # React hooks
│   │   ├── useAuth.ts                # Authentication hooks
│   │   ├── useProducts.ts            # Products hooks
│   │   ├── useUser.ts                # User management hooks
│   │   ├── useOrders.ts              # Orders hooks
│   │   ├── usePayments.ts            # Payments hooks
│   │   └── useStorefront.ts          # Storefront hooks
│   │
│   ├── pages/                        # Top-level pages
│   │   ├── HomePage.jsx              # Landing page
│   │   ├── HomeSections.jsx          # Home page sections
│   │   ├── TermsPage.jsx             # Terms of service
│   │   └── NotFoundPage.jsx          # 404 page
│   │
│   ├── styles/                       # Global styles
│   ├── lib/                          # Utility functions
│   ├── types/                        # TypeScript types
│   │
│   ├── App.jsx                       # Root component
│   ├── main.jsx                      # App entry point
│   └── index.css                     # Global CSS
│
├── docs/
│   └── API_CONTRACT.md               # Complete API specification
│
├── buyer_profile_streamlined.html    # Design reference for the buyer profile page
├── .env.example                      # Environment variables template
├── package.json                      # Dependencies and scripts
├── vite.config.js                    # Vite configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

---

<h2 id="frontend-development"><img src="https://api.iconify.design/octicon/code-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Frontend Development</h2>

### Available Scripts

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code with OxLint
npm run lint
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_MODE=mock                    # "mock" or "real"
VITE_API_URL=http://localhost:8000/api # Backend URL (only used in "real" mode)

# Mock API Settings
VITE_MOCK_LATENCY=                    # Set to "off" to disable mock latency

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Key Architectural Patterns

#### 1. Service Layer Pattern
All API calls go through service interfaces. Components never call `fetch()` directly.

```typescript
// Avoid: calling fetch() directly inside a component
const ProductCard = () => {
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    fetch('/api/products/123').then(/* ... */);
  }, []);
};

// Prefer: go through a service + hook
const ProductCard = () => {
  const { data: product } = useProduct('123');
};
```

#### 2. TanStack Query for Server State
All server data is managed by TanStack Query for automatic caching, background refetching, and optimistic updates.

```typescript
// Automatic caching and deduplication
const { data, isLoading, error } = useProducts({ page: 1 });

// Mutations with optimistic updates
const { mutate: updateProduct } = useUpdateProduct();
```

#### 3. Route-Based Code Splitting
Each route is lazy-loaded to minimize initial bundle size:

```jsx
const HomePage = lazy(() => import('./pages/HomePage'));
const SellerDashboard = lazy(() => import('./components/seller-dashboard/SellerDashboard'));
```

#### 4. Protected Routes
Authentication is enforced at the route level:

```jsx
<Route path="/seller" element={
  <RequireAuth accountType="seller">
    <SellerDashboard />
  </RequireAuth>
} />
```

### State Management Strategy

- **Server State**: TanStack Query (products, users, orders, etc.)
- **Client State**: React useState/useReducer (UI state, forms)
- **Persistent State**: localStorage (cart, saved items, tokens)
- **URL State**: React Router (pagination, filters, search)

### Adding New Features

#### Example: Adding a Reviews Feature

1. **Define the TypeScript types** (`src/types/index.ts`):
```typescript
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
```

2. **Create the service interface** (`src/api/services/reviews.ts`):
```typescript
export interface ReviewsApi {
  getReviews(productId: string): Promise<Review[]>;
  createReview(data: CreateReviewRequest): Promise<Review>;
}
```

3. **Implement mock version** (`src/api/mock/reviews.mock.ts`):
```typescript
export class MockReviewsApi implements ReviewsApi {
  async getReviews(productId: string): Promise<Review[]> {
    // Fetch from mockDatabase
  }
  async createReview(data: CreateReviewRequest): Promise<Review> {
    // Store in mockDatabase
  }
}
```

4. **Implement real version** (`src/api/real/reviews.api.ts`):
```typescript
export class RealReviewsApi implements ReviewsApi {
  async getReviews(productId: string): Promise<Review[]> {
    return httpClient.get(`/reviews?productId=${productId}`);
  }
  async createReview(data: CreateReviewRequest): Promise<Review> {
    return httpClient.post('/reviews', data);
  }
}
```

5. **Create React hooks** (`src/hooks/useReviews.ts`):
```typescript
export function useReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getReviews(productId),
  });
}
```

6. **Use in components**:
```jsx
const ProductReviews = ({ productId }) => {
  const { data: reviews, isLoading } = useReviews(productId);
  // Render reviews
};
```

---

<h2 id="backend-development"><img src="https://api.iconify.design/octicon/server-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Backend Development</h2>

### API Contract Overview

The frontend expects a REST API that follows the contract defined in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). The mock API implements this contract exactly, so you can develop the backend independently and swap it in seamlessly.

### Backend Requirements

#### 1. **Base URL**
All endpoints should be served under a base path (e.g., `/api/`):
```
https://api.yourdomain.com/api/auth/login
https://api.yourdomain.com/api/products
```

#### 2. **Request/Response Format**
- All requests/responses use `Content-Type: application/json`
- Protected endpoints require `Authorization: Bearer <accessToken>`
- Timestamps are ISO-8601 strings (`2024-02-15T10:30:00.000Z`)
- All JSON keys can be **camelCase** (preferred) or **snake_case** (normalized by frontend)

#### 3. **Error Format**
```json
{
  "message": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "fieldErrors": {
    "email": "This field is required",
    "password": "Must be at least 8 characters"
  }
}
```

#### 4. **Pagination Format**
```json
{
  "items": [...],
  "total": 145,
  "page": 1,
  "pageSize": 40
}
```

Django REST Framework's `{ count, results }` format is also supported.

#### 5. **Backend Product API Requirements**

The frontend product pagination system requires the backend to support **40 products per page** with robust pagination, search, and filtering capabilities. The marketplace uses infinite scroll with prefetching for optimal user experience.

##### **Workshop Product Limit (20 per seller)**

`POST /api/products` must reject a create when the seller already owns **20 products** (active + drafts combined) with:

- HTTP `422`, code `WORKSHOP_LIMIT_REACHED`
- Body: `{ "code": "WORKSHOP_LIMIT_REACHED", "message": "..." }`

The frontend mirrors this cap in the workshop UI (the "Add Product" button is disabled and the form blocked at 20/20) so sellers rarely hit the server error, but the backend check is the source of truth — never rely on the frontend alone.

##### **Required Endpoint: `GET /api/products`**

The backend must implement a single, flexible products endpoint that supports:

**Query Parameters:**
```
page          - Page number (default: 1)
page_size     - Items per page (default: 40, max: 50 recommended)
search        - Search query (searches name and description)
category      - Filter by category (Fashion, Electronics, Gadgets, Books, Others)
seller_id     - Filter by seller ID
status        - Filter by status (active, draft)
featured      - Filter by featured status (true, false)
```

**Example Requests:**
```bash
# Get first page of products (40 items)
GET /api/products/?page=1&page_size=40

# Get second page
GET /api/products/?page=2&page_size=40

# Search for products
GET /api/products/?search=nike&page=1&page_size=40

# Search + category filter
GET /api/products/?search=nike&category=Fashion&page=1&page_size=40

# Get seller's products
GET /api/products/?seller_id=123&page=1&page_size=40

# Get featured products only (public marketplace)
GET /api/products/?featured=true&status=active&page=1&page_size=40
```

**Response Format:**
```json
{
  "items": [
    {
      "id": "prod_001",
      "name": "Product Name",
      "description": "Product description",
      "price": 50000.00,
      "salePrice": 45000.00,
      "category": "Fashion",
      "imageUrl": "https://example.com/image.jpg",
      "images": ["url1", "url2"],
      "stock": 10,
      "status": "active",
      "featuredInMarketplace": true,
      "sellerId": "seller_001",
      "seller": "Store Name",
      "createdAt": "2024-02-15T10:30:00.000Z",
      "updatedAt": "2024-02-15T10:30:00.000Z"
    }
  ],
  "total": 145,
  "page": 1,
  "pageSize": 40
}
```

**Critical Requirements:**

1. **Pagination Metadata:**
   - `total`: Total number of products matching the query
   - `page`: Current page number
   - `pageSize`: Actual number of items per page (may differ from requested)
   - Frontend uses this to determine if more pages exist: `loaded < total`

2. **Consistent Results:**
   - Same query parameters must return same products on each page
   - Products should not appear on multiple pages
   - Order should be stable (e.g., newest first, by `createdAt DESC`)

3. **Performance:**
   - Response time should be under 200ms for typical queries
   - Use database indexes on frequently queried fields:
     - `status`, `category`, `seller_id`, `featured_in_marketplace`
     - Full-text search index on `name` and `description`
   - Implement query result caching for popular searches

4. **Search Behavior:**
   - Search should be case-insensitive
   - Search should match partial words in `name` and `description`
   - Empty/whitespace-only search should be treated as "no search filter"

5. **Filter Combination:**
   - All filters must work together (search + category + status + featured)
   - Example: "Nike" + "Fashion" + "active" + "featured=true"
   - Each filter narrows the result set

6. **Public Marketplace Visibility:**
   - Without `seller_id`: Only return `status=active` AND `featuredInMarketplace=true`
   - With `seller_id`: Return all products for that seller (if viewer is the owner), or only `status=active` products (for other viewers)
   - Draft products should never appear in public listings

7. **Empty Results:**
   - When no products match: `{ items: [], total: 0, page: 1, pageSize: 40 }`
   - Do not return errors for empty result sets

8. **Page Size Limits:**
   - Frontend requests 40 items per page by default
   - Backend should cap `page_size` at 50 to prevent excessive queries
   - If backend applies a lower limit, return that in `pageSize` field

**Frontend Behavior:**

The frontend implements:
- **Infinite scroll** with automatic prefetching at 50% scroll position
- **Search/filter reset**: Changing search or filters resets to page 1
- **Loading states**: Shows "Loading products..." while fetching next page
- **Duplicate prevention**: Tracks loading state to prevent multiple requests for the same page

**Django REST Framework Example:**

```python
# views.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

class ProductPagination(PageNumberPagination):
    page_size = 40
    page_size_query_param = 'page_size'
    max_page_size = 50

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['category', 'status', 'seller_id', 'featured_in_marketplace']
    ordering = ['-created_at']  # Newest first
    
    def get_queryset(self):
        queryset = Product.objects.select_related('seller')
        
        # Public marketplace: only active + featured products
        if not self.request.query_params.get('seller_id'):
            queryset = queryset.filter(
                status='active',
                featured_in_marketplace=True
            )
        
        return queryset
```

**Testing Checklist:**

- [ ] 40 products returned on first page (when available)
- [ ] Pagination metadata includes correct `total`, `page`, `pageSize`
- [ ] Page 2 returns the next 40 products (no duplicates from page 1)
- [ ] Search returns products matching the query
- [ ] Category filter works correctly
- [ ] Search + category combination works
- [ ] Featured filter works (public marketplace)
- [ ] Empty search returns all products
- [ ] No results returns empty array with `total: 0`
- [ ] Results are ordered consistently (e.g., newest first)
- [ ] Response time is acceptable (< 200ms typical)

### Recommended Django Setup

#### Project Structure
```
backend/
├── manage.py
├── requirements.txt
├── .env
│
├── config/                    # Django settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── apps/
│   ├── users/                 # User management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── products/              # Product catalog
│   ├── orders/                # Order management
│   ├── payments/              # Payment processing
│   └── storefront/            # Seller storefronts
│
└── utils/
    ├── auth.py                # JWT authentication
    ├── exceptions.py          # Custom exceptions
    └── pagination.py          # Pagination helpers
```

#### Essential Django Packages
```txt
Django>=4.2.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.3.0
django-cors-headers>=4.3.0
django-environ>=0.11.0
Pillow>=10.0.0
boto3>=1.28.0                  # For S3 uploads
stripe>=7.0.0                  # Or paystack
celery>=5.3.0
redis>=5.0.0
psycopg2-binary>=2.9.0
gunicorn>=21.2.0
```

#### Key Models

**User Model** (`apps/users/models.py`):
```python
from django.contrib.auth.models.AbstractUser import AbstractUser
from django.db import models

class User(AbstractUser):
    ACCOUNT_TYPES = [
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
    ]
    
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)
    avatar_url = models.URLField(blank=True, null=True)
    auth_provider = models.CharField(max_length=20, default='password')
    status = models.CharField(max_length=20, default='active')
    
    # Override username to use email
    username = None
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
```

**Product Model** (`apps/products/models.py`):
```python
from django.db import models

class Product(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('draft', 'Draft'),
    ]
    
    seller = models.ForeignKey('users.User', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(null=True, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    image_url = models.URLField(blank=True, null=True)
    image_alt = models.CharField(max_length=200, blank=True)
    images = models.JSONField(default=list, blank=True)
    variants = models.JSONField(default=list, blank=True)
    featured_in_marketplace = models.BooleanField(default=False)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Authentication Flow

1. **Registration** (`POST /api/auth/register`):
   - Hash password with PBKDF2-HMAC-SHA256 (Django default)
   - Create user record
   - Generate JWT access + refresh tokens
   - Return user + tokens

2. **Login** (`POST /api/auth/login`):
   - Validate email/password
   - Implement rate limiting (5 attempts, 15 min lockout)
   - Generate tokens
   - Return user + tokens

3. **Google OAuth** (`POST /api/auth/google`):
   - Verify Google ID token server-side
   - Check if user exists by email
   - If exists: authenticate existing user
   - If new: create user with `auth_provider='google'`
   - Return user + tokens + `isNewUser` flag

4. **Token Refresh** (`POST /api/auth/refresh`):
   - Validate refresh token
   - Generate new access + refresh tokens
   - Invalidate old refresh token

#### Security Checklist

- [ ] Passwords hashed with PBKDF2-HMAC-SHA256 (120k iterations minimum)
- [ ] JWT tokens with short expiration (24h access, 30d refresh)
- [ ] CSRF protection enabled for cookie-based auth
- [ ] CORS configured for allowed origins only
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection protection (use ORM, parameterized queries)
- [ ] XSS protection (sanitize user input)
- [ ] HTTPS enforced in production
- [ ] Environment variables for secrets (never commit to git)
- [ ] Image uploads validated (file type, size)
- [ ] API input validation on all endpoints

#### Database Schema

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for complete data models, including:
- User & SellerProfile
- Product & ProductVariant
- Order & OrderItem
- Payment & Transaction
- Storefront

### Switching to Real Backend

Once your backend is ready:

1. **Set environment variables** (`.env`):
```env
VITE_API_MODE=real
VITE_API_URL=https://api.yourdomain.com/api
```

2. **Restart the dev server**:
```bash
npm run dev
```

That's it. No code changes required. The frontend will automatically start making HTTP requests to your backend.

### Testing Backend Integration

Use these test scenarios:

1. **Authentication**:
   - Register new user (both buyer and seller)
   - Login with email/password
   - Login with Google OAuth
   - Token refresh
   - Logout

2. **Products**:
   - List products (public catalog)
   - Create product as seller
   - Update product
   - Delete product
   - Upload product images

3. **Orders**:
   - Create order as buyer
   - List orders (buyer view)
   - List seller orders (analytics endpoint)

4. **Seller Features**:
   - Create/update seller profile
   - View sales analytics
   - Feature products in marketplace

---

<h2 id="api-contract"><img src="https://api.iconify.design/octicon/plug-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;API Contract</h2>

See **[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)** for the complete API specification, including:

- All endpoints with request/response schemas
- Authentication requirements
- Error codes and handling
- Pagination format
- Data normalization rules
- Security model
- Type definitions

### Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Create new account |
| `/auth/login` | POST | No | Email/password login |
| `/auth/google` | POST | No | Google OAuth login/signup |
| `/auth/logout` | POST | Yes | Invalidate session |
| `/auth/me` | GET | Yes | Get current user |
| `/auth/refresh` | POST | No | Refresh access token |
| `/products` | GET | No | List products (filterable) |
| `/products/:id` | GET | No | Get single product |
| `/products` | POST | Yes | Create product (seller only, max 20 per workshop) |
| `/products/:id` | PATCH | Yes | Update product (owner only) |
| `/products/:id` | DELETE | Yes | Delete product (owner only) |
| `/storefront/:slug` | GET | No | Get seller storefront |
| `/users/me` | PATCH | Yes | Update account |
| `/users/me/seller-profile` | GET | Yes | Get seller profile |
| `/users/me/seller-profile` | PATCH | Yes | Update seller profile |
| `/users/me/password` | PATCH | Yes | Change password |
| `/orders` | GET | Yes | List buyer orders |
| `/orders` | POST | Yes | Create order |
| `/seller/orders` | GET | Yes | List seller orders (analytics) |
| `/payments/initialize` | POST | Yes | Initialize payment |
| `/payments/verify/:ref` | GET | Yes | Verify payment |
| `/uploads/images` | POST | Yes | Upload image |

---

<h2 id="authentication--security"><img src="https://api.iconify.design/octicon/shield-lock-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Authentication &amp; Security</h2>

### Authentication Flow

Universe uses **JWT-based authentication** with access and refresh tokens:

1. **Access Token**: Short-lived (24 hours), sent with every API request
2. **Refresh Token**: Long-lived (30 days), used to get new access tokens

```
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ Browser │                 │ Frontend │                │ Backend │
└────┬────┘                 └────┬────┘                └────┬────┘
     │                           │                          │
     │  1. Login credentials     │                          │
     ├───────────────────────────>                          │
     │                           │   POST /auth/login       │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │   User + Tokens          │
     │                           <─────────────────────────┤
     │   Store tokens (localStorage)                       │
     │                           │                          │
     │  2. API Request           │                          │
     ├───────────────────────────>                          │
     │                           │  GET /products           │
     │                           │  Authorization: Bearer <token>
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │   Products data          │
     │                           <─────────────────────────┤
     │                           │                          │
     │  3. Token expires         │                          │
     ├───────────────────────────>                          │
     │                           │  POST /auth/refresh      │
     │                           │  { refreshToken: "..." } │
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │  New tokens              │
     │                           <─────────────────────────┤
     │   Update tokens           │                          │
     │                           │                          │
     │  4. Logout                │                          │
     ├───────────────────────────>                          │
     │                           │  POST /auth/logout       │
     │                           │  Authorization: Bearer <token>
     │                           ├─────────────────────────>│
     │                           │                          │
     │                           │  204 — session revoked   │
     │                           <─────────────────────────┤
     │   Tokens cleared locally  │                          │
     │   (server session dead — the                           │
     │    refresh token is rejected)                          │
```

**Logout is server-side, not just a local token wipe.** When the user logs out
(from the Buyer Profile page or anywhere else), the frontend calls
`authApi.logout()`, which:

1. **Notifies the backend** — `POST /auth/logout` with the `Authorization:
   Bearer <token>` header. The backend revokes that session (and its refresh
   token), so it can never be used again even if it was copied.
2. **Clears local state in a `finally` block** — tokens are removed from
   localStorage even if the network call fails, so sign-out always takes
   effect locally.
3. **Resets the query cache** — TanStack Query is cleared so no data from the
   signed-out account lingers in memory.

In mock mode the same contract is honored: `MockAuthApi.logout()` deletes the
matching session row (access **and** refresh token hashes) from the mock
database before clearing local tokens, so a "logged out" refresh token is
rejected exactly like it would be against a real server.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   https://yourdomain.com
   ```
7. Copy the **Client ID** and add to `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   ```

### Security Best Practices

#### Frontend
- [x] Tokens stored in `localStorage` (XSS mitigation via CSP)
- [x] Automatic token refresh before expiration
- [x] Logout clears all tokens
- [x] Protected routes enforce authentication
- [x] No sensitive data logged to console in production

#### Backend (Recommendations)
- [x] Use HTTPS in production (TLS 1.2+)
- [x] Hash passwords with PBKDF2-HMAC-SHA256 (120k+ iterations)
- [x] Implement rate limiting (e.g., 5 login attempts per 15 min)
- [x] Validate JWT signatures and expiration
- [x] Rotate refresh tokens on each use
- [x] Revoke tokens on password change
- [x] Use CSRF tokens for cookie-based auth
- [x] Sanitize all user input
- [x] Implement CORS with allowed origins only
- [x] Log security events (failed logins, suspicious activity)

---

<h2 id="deployment"><img src="https://api.iconify.design/octicon/cloud-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Deployment</h2>

### Frontend Deployment

#### Build for Production

```bash
# Install dependencies
npm install

# Build optimized bundle
npm run build

# Output in ./dist directory
```

The `dist` folder contains optimized HTML, CSS, JS, and assets ready for deployment.

#### Deployment Platforms

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel --prod
```

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**AWS S3 + CloudFront**:
```bash
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**Nginx** (Self-hosted):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/universe/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backend Deployment

#### Django + Gunicorn + Nginx

**requirements.txt**:
```txt
Django==4.2.7
djangorestframework==3.14.0
gunicorn==21.2.0
psycopg2-binary==2.9.9
# ... other dependencies
```

**Gunicorn command**:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

**Nginx config**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/universe-backend/static/;
    }

    location /media/ {
        alias /var/www/universe-backend/media/;
    }
}
```

#### Docker Deployment

**Dockerfile** (Frontend):
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  frontend:
    build: ./universe-react
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./universe-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/universe
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=universe
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Environment Variables (Production)

**Frontend (`.env.production`)**:
```env
VITE_API_MODE=real
VITE_API_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
```

**Backend**:
```env
DEBUG=False
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=postgresql://user:password@db-host:5432/universe
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# AWS S3 (for media uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=universe-media
AWS_S3_REGION_NAME=us-east-1

# Payment Gateway
PAYSTACK_SECRET_KEY=your-paystack-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key

# Redis (for caching)
REDIS_URL=redis://localhost:6379/0
```

---

<h2 id="contributing"><img src="https://api.iconify.design/octicon/git-pull-request-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Contributing</h2>

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (both mock and real API modes)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **JavaScript/TypeScript**: Follow the existing code style (enforced by OxLint)
- **React**: Use functional components with hooks
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Write clear, concise comments for complex logic

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Changes work in both mock and real API modes
- [ ] No console errors or warnings
- [ ] Responsive design tested on mobile, tablet, and desktop
- [ ] Accessibility guidelines followed (keyboard navigation, ARIA labels)
- [ ] PR description clearly explains the changes and motivation

### Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Numbered steps to reproduce the behavior
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**: Browser, OS, Node version

### Feature Requests

For new features, please:

1. Search existing issues to avoid duplicates
2. Clearly describe the feature and use case
3. Explain why this feature would be useful
4. Provide mockups or examples if applicable

---

<h2 id="license"><img src="https://api.iconify.design/octicon/law-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;License</h2>

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<h2 id="support--contact"><img src="https://api.iconify.design/octicon/comment-discussion-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Support &amp; Contact</h2>

- **Documentation**: [API Contract](docs/API_CONTRACT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/universe-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/universe-react/discussions)
- **Email**: support@universe.app

---

<h2 id="acknowledgments"><img src="https://api.iconify.design/octicon/heart-fill-24.svg?color=%236e7681" width="20" height="20" align="absmiddle" alt=""/>&nbsp;Acknowledgments</h2>

- **React Team** for React 19 concurrent features
- **Evan You** and the Vite team for blazing-fast tooling
- **TanStack** for excellent state management libraries
- **Django Software Foundation** for Django REST Framework
- All contributors who have helped shape this project

---

<div align="center">

**Built by the Universe Team** <img src="https://api.iconify.design/octicon/heart-fill-16.svg?color=%23e05d6f" width="14" height="14" align="absmiddle" alt=""/>

[⬆ Back to Top](#universe--e-commerce-marketplace-platform)

</div>