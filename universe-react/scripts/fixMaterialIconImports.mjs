import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.jsx')) out.push(p);
  }
  return out;
}

let fixed = 0;
for (const file of walk(SRC)) {
  let code = fs.readFileSync(file, 'utf8');
  const re = /import MaterialIcon from '([^']+)';/;
  const m = code.match(re);
  if (!m) continue;

  const relFromSrc = path.relative(path.dirname(file), SRC);
  const correct = path
    .join(relFromSrc, 'components', 'ui', 'MaterialIcon')
    .split(path.sep)
    .join('/');
  // Paths inside src/components/ui itself resolve directly.
  const target = file.includes(`${path.sep}ui${path.sep}`)
    ? './MaterialIcon'
    : correct;

  if (m[1] !== target) {
    code = code.replace(re, `import MaterialIcon from '${target}';`);
    fs.writeFileSync(file, code);
    console.log(`${path.relative(SRC, file)}: '${m[1]}' -> '${target}'`);
    fixed++;
  }
}
console.log(`fixed ${fixed} import paths`);
