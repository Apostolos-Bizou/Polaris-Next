const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// Modal box background — match the site's lighter navy-blue
c = c.replace(`background: #111c2e;`, `background: #162a44;`);

// Modal body background  
c = c.replace(
  `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #0f1e30; }`,
  `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #162a44; }`
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Modal background changed to lighter navy-blue (#162a44)');
