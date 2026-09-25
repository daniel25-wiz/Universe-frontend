/**
 * One-off codemod: converts <span className="material-symbols-outlined...">NAME</span>
 * to <MaterialIcon name="NAME" /> across src/.
 *
 * Handles:
 *  - static children:            <span ...>add</span>
 *  - dynamic children:           <span ...>{item.icon}</span>
 *  - ternary children:           <span ...>{cond ? 'a' : 'b'}</span>
 *  - optional-chain defaults:    <span ...>{toast?.icon ?? 'check_circle'}</span>
 *  - fill variants:              className contains sf-fill  -> fill prop
 *  - data-weight attr:           data-weight="fill"          -> fill prop
 *  - existing classes preserved, import added per file (skips ui/MaterialIcon.jsx)
 *
 * Run with:  node scripts/codemodMaterialIcons.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.jsx')) out.push(p);
  }
  return out;
}

const fillClassRe = /\bsf-fill\b/;
let total = 0;
const changedFiles = [];

for (const file of walk(SRC)) {
  if (file.endsWith('MaterialIcon.jsx')) continue;
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('material-symbols-outlined')) continue;

  const before = code;

  // Match the full span: attrs + children up to </span>.
  const spanRe = /<span\b([^>]*?)className="([^"]*\bmaterial-symbols-outlined\b[^"]*)"([^>]*)>([\s\S]*?)<\/span>/g;

  code = code.replace(spanRe, (full, preAttrs, cls, postAttrs, children) => {
    const allAttrs = (preAttrs + ' ' + postAttrs).trim();

    // Determine fill: explicit data-weight="fill" or the sf-fill class.
    const isFill = /data-weight=.fill./.test(allAttrs) || fillClassRe.test(cls);

    // Strip fill-related markers from the class list (the SVG handles fill now).
    const cleanCls = cls
      .replace(/\bmaterial-symbols-outlined\b/g, '')
      .replace(/\bsf-fill\b/g, '')
      .replace(/\sfilled-icon\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Resolve children to a name or expression.
    const child = children.trim();
    let nameProp;

    const staticM = child.match(/^([a-z0-9_]+)$/);
    if (staticM) {
      nameProp = `"${staticM[1]}"`;
    } else {
      const exprM = child.match(/^\{([\s\S]+)\}$/);
      if (!exprM) return full; // unrecognised — leave untouched
      let expr = exprM[1].trim();

      // Static-string ternary: cond ? 'a' : 'b'  ->  cond ? "a" : "b"
      expr = expr.replace(/'([a-z0-9_]+)'/g, '"$1"');

      nameProp = `{${expr}}`;
    }

    const clsProp = cleanCls ? ` className="${cleanCls}"` : '';
    const fillProp = isFill ? ' fill' : '';
    return `<MaterialIcon name=${nameProp}${clsProp}${fillProp} />`;
  });

  if (code === before) continue;

  // Add the import if this file now uses MaterialIcon but doesn't import it.
  if (code.includes('<MaterialIcon') && !code.includes("from './ui/MaterialIcon'") && !code.includes("from '../ui/MaterialIcon'")) {
    const rel = file.includes(`${path.sep}ui${path.sep}`)
      ? './MaterialIcon'
      : file.includes(`${path.sep}components${path.sep}`)
        ? '../ui/MaterialIcon'
        : '../../components/ui/MaterialIcon';
    // Insert after the last existing import line.
    const importRe = /^import[\s\S]*?from\s+['"][^'"]+['"];.*$/m;
    const lines = code.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImport = i;
    }
    lines.splice(lastImport + 1, 0, `import MaterialIcon from '${rel}';`);
    code = lines.join('\n');
  }

  fs.writeFileSync(file, code);
  total++;
  changedFiles.push(path.relative(SRC, file));
}

console.log(`Converted ${total} files:`);
changedFiles.forEach((f) => console.log('  ' + f));
