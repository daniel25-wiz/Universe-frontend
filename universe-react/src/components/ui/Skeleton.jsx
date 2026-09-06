/**
 * Skeleton — tiny shimmering placeholder primitive.
 * Stays in the main chunk (no deps) so skeletons render instantly.
 */
const Skeleton = ({ width, height = 16, circle = false, className = "", style }) => (
  <div
    className={`skeleton${className ? ` ${className}` : ""}`}
    style={{ width, height, ...(circle ? { borderRadius: "50%" } : {}), ...style }}
    aria-hidden="true"
  />
);

export default Skeleton;