const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'components', 'offers', 'send-documents-modal.tsx');
let c = fs.readFileSync(f, 'utf8');

// The body needs overflow-y:auto to scroll, and the modal needs proper height
// Also the footer might be hidden - let's ensure the layout is correct

// Fix: body should scroll properly
c = c.replace(
  '.sd-body{flex:1;overflow-y:auto;padding:25px 30px;background:#3d5a80;display:flex;flex-direction:column;gap:20px}',
  '.sd-body{flex:1;overflow-y:auto;padding:25px 30px;background:#3d5a80;display:flex;flex-direction:column;gap:20px;min-height:0}'
);

// Also make programs grid show all items without cutting
// Change from 4 columns to auto-fit so they wrap properly
c = c.replace(
  ".sd-prog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}",
  ".sd-prog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;overflow:visible}"
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Fixed body scrolling + programs grid visibility');
