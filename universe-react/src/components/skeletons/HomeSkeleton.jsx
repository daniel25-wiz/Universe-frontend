import Skeleton from '../ui/Skeleton';

/**
 * HomeSkeleton — layout-matching skeleton for the "/" landing route.
 * Mirrors the navbar + hero + section shells.
 */
const HomeSkeleton = () => (
  <div className="sk-home" role="status" aria-label="Loading home page">
    <nav className="sk-navbar">
      <Skeleton width={120} height={32} />
      <div className="sk-navlinks sk-row">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={70} height={14} />
        ))}
      </div>
      <div className="sk-actions sk-row">
        <Skeleton width={90} height={38} />
        <Skeleton width={130} height={38} />
      </div>
    </nav>

    <div className="sk-hero">
      <Skeleton width="52%" height={54} />
      <Skeleton width="36%" height={54} />
      <div style={{ height: 8 }} />
      <Skeleton width="46%" height={16} />
      <Skeleton width="32%" height={16} />
      <div style={{ height: 8 }} />
      <Skeleton width={180} height={46} />
    </div>

    <div className="sk-sections">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="sk-section-row">
          <Skeleton width="14%" height={16} />
          <Skeleton width="100%" height={180} />
        </div>
      ))}
    </div>
  </div>
);

export default HomeSkeleton;