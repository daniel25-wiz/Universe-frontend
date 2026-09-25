/**
 * Generates src/components/ui/materialIconPaths.json from Google's
 * material-design-icons repo at OPTICAL SIZE 24 (opsz 24), which matches the
 * font rendering previously used (font-variation-settings 'opsz' 24).
 *
 * The @material-symbols/svg-400 package is opsz 48 (thinner strokes) and is
 * only used as an offline fallback.
 *
 * Run with:  node scripts/generateMaterialIcons.cjs
 */
const fs = require('fs');
const path = require('path');

const RAW = 'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web';
const FALLBACK = path.join(__dirname, '..', 'node_modules', '@material-symbols', 'svg-400', 'outlined');
const CACHE = path.join(__dirname, '.material-symbols-cache');

// Every icon name referenced anywhere in src/ (static, dynamic, or mock data).
const NAMES = [
  'account_circle', 'add', 'add_a_photo', 'arrow_back', 'arrow_downward',
  'arrow_drop_down', 'arrow_forward', 'assignment_return', 'bookmark_add',
  'bookmark_added', 'brush', 'call', 'category', 'celebration', 'chat',
  'check', 'check_circle', 'close', 'cloud_upload', 'computer',
  'content_copy', 'dangerous', 'delete', 'delete_forever', 'domain_disabled',
  'done_all', 'edit', 'edit_note', 'error', 'expand_more', 'favorite',
  'feedback', 'filter_list', 'help', 'home', 'image', 'inventory_2',
  'language', 'link', 'local_shipping', 'location_on', 'lock', 'logout',
  'mail', 'menu', 'military_tech', 'monitoring', 'more_vert', 'notifications',
  'open_in_new', 'panorama', 'payments', 'phone', 'pin_drop', 'publish',
  'refresh', 'reply_all', 'save', 'school', 'search', 'search_off', 'sell',
  'sentiment_satisfied', 'settings', 'share', 'shield_with_heart',
  'shopping_bag', 'sort', 'speed', 'star', 'store', 'storefront',
  'support_agent', 'sync', 'tune', 'unpublish', 'upload', 'verified',
  'verified_user', 'warning',
];

// Icons whose filled variant is used (sf-fill class / fill prop / active nav).
const FILL_VARIANTS = [
  'bookmark_added', 'check_circle', 'favorite', 'home', 'inventory_2',
  'monitoring', 'payments', 'sentiment_satisfied', 'settings', 'star',
  'storefront', 'verified', 'warning', 'account_circle',
];

async function fetchUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function getPath(name, suffix) {
  const cacheFile = path.join(CACHE, `${name}${suffix}.d`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');

  // 1) Google repo at opsz 24.
  try {
    const svg = await fetchUrl(
      `${RAW}/${name}/materialsymbolsoutlined/${name}${suffix}_24px.svg`,
    );
    const d = svg.match(/ d="([^"]+)"/)?.[1];
    if (!d) throw new Error('no path data');
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(cacheFile, d);
    return d;
  } catch (err) {
    console.warn(`  github miss for ${name}${suffix}: ${err.message}`);
  }

  // 2) npm package fallback (opsz 48).
  const local = path.join(FALLBACK, `${name}${suffix.replace('_fill1', '-fill')}.svg`);
  if (fs.existsSync(local)) {
    const d = fs.readFileSync(local, 'utf8').match(/ d="([^"]+)"/)?.[1];
    if (d) {
      console.warn(`  using npm fallback (opsz 48) for ${name}${suffix}`);
      return d;
    }
  }
  return null;
}

async function main() {
  const outline = {};
  const fill = {};
  const missing = [];

  for (const name of NAMES) {
    const d = await getPath(name, '');
    if (d) outline[name] = d;
    else missing.push(name);

    if (FILL_VARIANTS.includes(name)) {
      const f = await getPath(name, '_fill1');
      if (f) fill[name] = f;
    }
  }

  const out = path.join(__dirname, '..', 'src', 'components', 'ui', 'materialIconPaths.json');
  fs.writeFileSync(out, JSON.stringify({ outline, fill }));

  console.log(`outline: ${Object.keys(outline).length}, fill: ${Object.keys(fill).length}`);
  if (missing.length) {
    console.error('MISSING:', missing);
    process.exitCode = 1;
  }
}

main();

