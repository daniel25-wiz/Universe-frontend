import paths from './materialIconPaths.json';

/** Ligature names that don't exist as glyphs (rendered as raw text in the
 *  old font); map them to their closest real icons. */
const ALIASES = {
  phone: 'call',
  unpublish: 'publish',
};

/**
 * Inline-SVG replacement for the Material Symbols Outlined icon font.
 *
 * Renders the icon at 1em so the existing size classes (sf-i14, sf-i16,
 * sd-nav-icon, ap-loc-icon, ...) keep working via font-size, and inherits
 * `currentColor` so all existing color classes/hover states work unchanged.
 *
 * Paths are Google's static opsz-24 SVGs — the same optical size the icon
 * font rendered at ('opsz' 24), so stroke weight and glyph size match.
 *
 * Fill handling mirrors the font's FILL axis:
 *  - `fill` prop sets data-fill on the <svg>
 *  - CSS shows .mi-f / hides .mi-o for [data-fill], or for any selector that
 *    used to apply font-variation-settings 'FILL' 1 (e.g. active nav links)
 *
 * Usage:
 *   <MaterialIcon name="add" />
 *   <MaterialIcon name="star" fill className="sf-i14" />
 */
export default function MaterialIcon({ name, fill = false, className = '', style, ...rest }) {
  const key = ALIASES[name] ?? name;
  const outlineD = paths.outline[key];
  const fillD = paths.fill[key];

  if (!outlineD) {
    if (import.meta.env?.DEV) {
      console.warn(`[MaterialIcon] Unknown icon: "${name}"`);
    }
    return null;
  }

  return (
    <svg
      // Keep the legacy class: dashboard/storefront CSS sizes icons via
      // descendant selectors like `.sd-add-btn .material-symbols-outlined`.
      // font-family has no effect on SVG, but font-size drives the 1em size.
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={style}
      viewBox="0 -960 960 960"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-fill={fill && fillD ? '' : undefined}
      {...rest}
    >
      <path className="mi-o" d={outlineD} />
      {fillD && <path className="mi-f" d={fillD} />}
    </svg>
  );
}

