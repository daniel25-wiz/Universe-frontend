import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import { sessionStore } from '../../api/session';
import DashboardSkeleton from '../skeletons/DashboardSkeleton';

/**
 * Route guard for authenticated (and optionally seller-only) pages.
 *
 * - No tokens at all  -> redirect to /auth/login, remembering where the user
 *   was headed so login can return them there.
 * - Tokens but no valid session (401 after silent refresh) -> same redirect.
 * - Logged in as a buyer on a seller route -> back to the public home page.
 * - While the session check is in flight -> dashboard skeleton (no flash).
 *
 * This is the UI half of the security model; the API layer independently
 * enforces authorization for every request, so the guard is convenience and
 * UX, never the only line of defense.
 */
function RequireAuth({ children, accountType }) {
  const location = useLocation();
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!sessionStore.hasTokens()) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (isError || !user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, sessionExpired: true }}
        replace
      />
    );
  }
  if (accountType && user.accountType !== accountType) {
    return <Navigate to="/" replace />;
  }
  return typeof children === 'function' ? children(user) : children;
}

export default RequireAuth;
