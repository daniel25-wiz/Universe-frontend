const fs = require('fs');
const file = 'src/components/seller-dashboard/views/SellerProfile.jsx';
let c = fs.readFileSync(file, 'utf8');
// Debug: find the exact text to replace
const marker = '</div>\r\n';
let idx = c.indexOf(marker);
let count = 0;
while (idx !== -1 && count < 10) {
  console.log('Found </div> at ' + idx + ':', JSON.stringify(c.substring(idx, idx + 80)));
  idx = c.indexOf(marker, idx + 1);
  count++;
}
