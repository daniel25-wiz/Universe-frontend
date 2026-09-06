import Skeleton from '../ui/Skeleton';

/**
 * DashboardSkeleton — layout-matching skeleton for the /seller area.
 * Mirrors the real chrome: fixed sidebar, top app bar, page title,
 * stat cards and the chart/activity panels.
 */
const DashboardSkeleton = () => (
  <div className="sk-dashboard" role="status" aria-label="Loading dashboard">
    {/* Sidebar */}
    <div className="sk-sidebar">
      <Skeleton width={112} height={30} />
      <Skeleton width="100%" height={42} />
      <div className="sk-navgroup">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={34} />
        ))}
      </div>
      <div className="sk-spacer" />
      <Skeleton width="80%" height={24} />
      <Skeleton width="80%" height={24} />
    </div>

    {/* Main column */}
    <div className="sk-main">
      <div className="sk-topbar">
        <div className="sk-row">
          <Skeleton width={40} height={40} circle />
          <Skeleton width={180} height={36} />
        </div>
        <div className="sk-row">
          <Skeleton width={40} height={40} circle />
          <Skeleton width={40} height={40} circle />
          <Skeleton width={40} height={40} circle />
        </div>
      </div>

      <div className="sk-content">
        <div className="sk-row-across">
          <Skeleton width="34%" height={30} />
          <div className="sk-row">
            <Skeleton width={90} height={34} />
            <Skeleton width={80} height={34} />
          </div>
        </div>

        <div className="sk-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk-card">
              <Skeleton width="70%" height={14} />
              <Skeleton width="55%" height={26} />
              <Skeleton width="80%" height={12} />
            </div>
          ))}
        </div>

        <div className="sk-panels">
          <div className="sk-panel">
            <Skeleton width="35%" height={18} />
            <Skeleton width="100%" height={130} />
          </div>
          <div className="sk-panel">
            <Skeleton width="45%" height={18} />
            <Skeleton width="100%" height={90} />
            <Skeleton width="100%" height={90} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;