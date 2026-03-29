const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// Modal box — match admin layout background (#3d5a80)
c = c.replace(`background: #162a44;`, `background: #3d5a80;`);

// Modal body — same
c = c.replace(
  `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #162a44; }`,
  `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #3d5a80; }`
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Modal background now matches admin layout (#3d5a80)');
