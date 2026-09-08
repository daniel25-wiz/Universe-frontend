import Skeleton from '../ui/Skeleton';

/**
 * TermsSkeleton — layout-matching skeleton for the "/terms" route.
 * Mirrors the sticky header + hero + two-column (sidebar TOC / clause cards).
 */
const TermsSkeleton = () => (
  <div className="sk-home" role="status" aria-label="Loading Terms of Service">
    <nav className="sk-navbar">
      <Skeleton width={120} height={32} />
      <div className="sk-navlinks sk-row">
        <Skeleton width={220} height={32} />
      </div>
      <div className="sk-actions sk-row">
        <Skeleton width={110} height={30} />
        <Skeleton width={100} height={30} />
      </div>
    </nav>

    <div className="sk-hero" style={{ textAlign: 'left' }}>
      <Skeleton width={180} height={40} />
      <Skeleton width="52%" height={54} />
      <div style={{ height: 8 }} />
      <Skeleton width="46%" height={16} />
      <Skeleton width="38%" height={16} />
      <div style={{ height: 8 }} />
      <Skeleton width="86%" height={46} />
    </div>

    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '4fr 8fr', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton width="100%" height={220} />
        <Skeleton width="100%" height={110} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={120} />
        ))}
      </div>
    </div>
  </div>
);

export default TermsSkeleton;