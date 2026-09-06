const fs = require('fs');
const file = process.argv[2];
const c = fs.readFileSync(file, 'utf8');
const lines = c.split('\n');
const start = process.argv[3] ? parseInt(process.argv[3]) : 1;
const end = process.argv[4] ? parseInt(process.argv[4]) : lines.length;
for (let i = start - 1; i < Math.min(end, lines.length); i++) {
  console.log((i + 1) + '|' + lines[i]);
}
