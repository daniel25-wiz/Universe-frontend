import Skeleton from '../ui/Skeleton';

/**
 * AuthSkeleton — layout-matching skeleton for /auth.
 * Mirrors the auth page: back button, centered white card with the
 * gradient accent strip, logo area, form fields and buttons.
 */
const AuthSkeleton = () => (
  <div className="sk-auth" role="status" aria-label="Loading authentication page">
    <div className="sk-back">
      <Skeleton width={40} height={40} circle />
    </div>
    <div style={{ height: 16 }} />

    <div className="sk-card">
      <div className="sk-accent" aria-hidden="true"></div>
      <div className="sk-body">
        <Skeleton width={72} height={56} />
        <Skeleton width="45%" height={26} />
        <Skeleton width="70%" height={14} />
        <div style={{ height: 8 }} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="55%" height={16} />
        <Skeleton width="100%" height={44} />
        <Skeleton width="100%" height={44} />
        <Skeleton width="55%" height={16} />
      </div>
    </div>

    <div style={{ height: 24 }} />
    <Skeleton width={220} height={12} />
  </div>
);

export default AuthSkeleton;