const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// Remove the onClick and cursor from the <tr> row
// The row currently has: onClick={() => openDetail(offer)} style={{ cursor: 'pointer' }}
c = c.replace(
  /(<tr[^>]*className="offer-row")[^>]*onClick=\{[^}]*\}[^>]*style=\{\{[^}]*\}\}/,
  '$1'
);

console.log('✅ Removed onClick from table row');

fs.writeFileSync(f, c, 'utf8');
console.log('📄 Saved:', c.length, 'chars');
