const fs = require('fs');
const file = 'src/components/seller-dashboard/views/SellerProfile.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the broken indentation on the sd-topbar-actions div in SellerProfile
content = content.replace(
  '</div>\r\n                              <div class="sd-topbar-actions">\r\n',
  '</div>\r\n          <div class="sd-topbar-actions">\r\n'
);

fs.writeFileSync(file, content);
console.log('Fixed SellerProfile.jsx indentation');
