import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardSkeleton from '../skeletons/DashboardSkeleton';

/**
 * Keyed Suspense wrapper for lazy dashboard views.
 *
 * When switching between /seller/* views, React (and React Router's route
 * transitions) can otherwise REUSE the same Suspense boundary and keep the
 * old view visible while the next chunk downloads — so no skeleton would show.
 * Keying the boundary by pathname forces a fresh mount on every navigation,
 * which makes the DashboardSkeleton appear the moment the user clicks a nav
 * option and stay until the target view's chunk is ready.
 */
const DashboardView = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <Suspense key={pathname} fallback={<DashboardSkeleton />}>
      {children}
    </Suspense>
  );
};

export default DashboardView;