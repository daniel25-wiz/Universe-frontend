const fs = require('fs');
const file = 'src/components/seller-dashboard/views/PublicMarketplace.jsx';
let content = fs.readFileSync(file, 'utf8');

const deadStart = content.indexOf("  {\r\n    id: 1,");
const deadEnd = content.indexOf("/**\r\n * Public Marketplace");
console.log('deadStart:', deadStart, 'deadEnd:', deadEnd);
if (deadStart === -1 || deadEnd === -1) {
  console.error('Could not find dead code boundaries');
  process.exit(1);
}
content = content.slice(0, deadStart) + content.slice(deadEnd);

fs.writeFileSync(file, content);
console.log('Cleaned PublicMarketplace.jsx');
console.log('New length:', content.length);


