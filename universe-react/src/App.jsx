import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomeSkeleton from './components/skeletons/HomeSkeleton';
import AuthSkeleton from './components/skeletons/AuthSkeleton';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';
import TermsSkeleton from './components/skeletons/TermsSkeleton';
import { parseStoreSubdomain } from './lib/storeDomain';

/**
 * Route-level code splitting.
 *
 * Each route's components live in their own chunk and are only downloaded when
 * that route is visited for the first time. E.g. clicking "My Workshop" fetches
 * only the MyMarketplace view — the other dashboard views never load unless
 * needed.
 *
 * The dashboard shell and each view stay lazy so seller-dashboard.css (with its
 * dashboard-only fonts) loads only when a /seller page loads, never on the
 * home page. Hover/focus on any nav link additionally prefetches the target
 * chunk (see src/lib/prefetch), so most clicks resolve instantly.
 *
 * Every lazy dashboard view renders through <DashboardView>, which keys its
 * Suspense boundary by the current pathname. That guarantees the
 * DashboardSkeleton shows the moment the user clicks a sidebar/nav option and
 * stays until the target view's chunk is ready.
 *
 * SECURITY: the whole /seller subtree is wrapped in <RequireAuth
 * accountType="seller"> — unauthenticated visitors and buyers are redirected
 * before any dashboard code even downloads. The API layer enforces the same
 * rules independently on every request.
 */
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));
const RequireAuth = lazy(() => import('./components/auth/RequireAuth'));
const SellerDashboard = lazy(() => import('./components/seller-dashboard/SellerDashboard'));
const SellerOnboarding = lazy(() => import('./components/seller-onboarding/SellerOnboarding'));
const DashboardView = lazy(() => import('./components/seller-dashboard/DashboardView'));
const DashboardOverview = lazy(() => import('./components/seller-dashboard/views/DashboardOverview'));
const MyMarketplace = lazy(() => import('./components/seller-dashboard/views/MyMarketplace'));
const PublicMarketplace = lazy(() => import('./components/seller-dashboard/views/PublicMarketplace'));
const SalesAnalytics = lazy(() => import('./components/seller-dashboard/views/SalesAnalytics'));
const SellerProfile = lazy(() => import('./components/seller-dashboard/views/SellerProfile'));
const SellerSettings = lazy(() => import('./components/seller-dashboard/views/SellerSettings'));
const AddProductPage = lazy(() => import('./components/seller-dashboard/ui/AddProductPage'));
const EditProductPage = lazy(() => import('./components/seller-dashboard/ui/EditProductPage'));
const StorefrontPage = lazy(() => import('./components/storefront/StorefrontPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

/**
 * Store-domain gateway.
 *
 * When the app is served on a store domain (storename.localhost in dev,
 * storename.<app-domain> in production with wildcard DNS), the visitor lands
 * on the seller's PRIVATE MARKETPLACE instead of the platform home page.
 * Hosts without wildcard subdomain support keep using the canonical
 * /store/:storeSlug path form below.
 */
function SubdomainGateway() {
  const location = useLocation();
  const [storeSlug] = useState(() => parseStoreSubdomain(window.location.hostname));
  if (storeSlug && (location.pathname === '/' || location.pathname === '')) {
    return <Navigate to={`/store/${storeSlug}`} replace />;
  }
  return null;
}

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Detect if we are on file:// protocol
    if (window.location.protocol === "file:") {
      setShowWarning(true);
    }

    // Scroll reveal logic
    const handleScrollReveal = () => {
      const reveals = document.querySelectorAll(".reveal");
      reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
          el.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", handleScrollReveal);
    // Initial check
    setTimeout(handleScrollReveal, 200);

    return () => window.removeEventListener("scroll", handleScrollReveal);
  }, []);

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  return (
    <>
      {showWarning && (
        <div className="local-cors-warning">
          <div className="warning-content">
            <svg className="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className="warning-text">
              <h4>Local File Warning (CORS Restriction)</h4>
              <p>
                Babel Standalone cannot compile external JavaScript files (like <code>app.js</code>) under the <code>file://</code> protocol in some browsers. To view this modular template, run a local web server (e.g. <code>python -m http.server</code>) or open <a href="index_standalone.html" style={{ textDecoration: "underline", fontWeight: 700, color: "#991B1B" }}>index_standalone.html</a> directly, which has the code inlined.
              </p>
            </div>
          </div>
          <button className="warning-close" onClick={() => setShowWarning(false)} aria-label="Dismiss warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <SubdomainGateway />
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<HomeSkeleton />}>
              <HomePage cartCount={cartCount} onAddToCart={handleAddToCart} />
            </Suspense>
          }
        />
        {/* Seller PRIVATE MARKETPLACE — served on their own domain
            (storename.<app-domain>) or via this canonical path alias. */}
        <Route
          path="/store/:storeSlug"
          element={
            <Suspense
              fallback={
                <div
                  style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#faf8ff',
                    color: '#434655',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 14,
                  }}
                >
                  Opening storefront…
                </div>
              }
            >
              <StorefrontPage />
            </Suspense>
          }
        />
        <Route
          path="/auth"
          element={
            <Suspense fallback={<AuthSkeleton />}>
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/auth/:mode"
          element={
            <Suspense fallback={<AuthSkeleton />}>
              <AuthPage />
            </Suspense>
          }
        />
        <Route
          path="/seller/onboarding"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <RequireAuth accountType="seller">
                <SellerOnboarding />
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path="/seller"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <RequireAuth accountType="seller">
                <SellerDashboard />
              </RequireAuth>
            </Suspense>
          }
        >
          <Route
            index
            element={
              <DashboardView>
                <DashboardOverview />
              </DashboardView>
            }
          />
          <Route
            path="marketplace"
            element={
              <DashboardView>
                <MyMarketplace />
              </DashboardView>
            }
          />
          <Route
            path="public-marketplace"
            element={
              <DashboardView>
                <PublicMarketplace />
              </DashboardView>
            }
          />
          <Route
            path="sales"
            element={
              <DashboardView>
                <SalesAnalytics />
              </DashboardView>
            }
          />
          <Route
            path="settings"
            element={
              <DashboardView>
                <SellerSettings />
              </DashboardView>
            }
          />
          <Route
            path="profile"
            element={
              <DashboardView>
                <SellerProfile />
              </DashboardView>
            }
          />
          <Route
            path="add-product"
            element={
              <DashboardView>
                <AddProductPage />
              </DashboardView>
            }
          />
          <Route
            path="edit-product/:productId"
            element={
              <DashboardView>
                <EditProductPage />
              </DashboardView>
            }
          />
        </Route>
        <Route
          path="/terms"
          element={
            <Suspense fallback={<TermsSkeleton />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
