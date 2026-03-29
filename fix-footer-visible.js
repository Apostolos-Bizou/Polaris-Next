const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'components', 'offers', 'send-documents-modal.tsx');
let c = fs.readFileSync(f, 'utf8');

// The modal uses flex-direction:column with flex:1 on body
// Footer has flex-shrink:0 but it might be outside the flex container
// Let's ensure the footer stays at bottom

// Fix: add min-height:0 to body so it shrinks and footer stays visible
c = c.replace(
  '.sd-body{flex:1;overflow-y:auto;padding:25px 30px;background:#3d5a80;display:flex;flex-direction:column;gap:20px}',
  '.sd-body{flex:1;overflow-y:auto;padding:25px 30px;background:#3d5a80;display:flex;flex-direction:column;gap:20px;min-height:0}'
);

// Ensure footer has flex-shrink:0
if (!c.includes('sd-footer') || !c.includes('flex-shrink:0')) {
  c = c.replace(
    '.sd-footer{background:#0d1f2d;padding:12px 30px;display:flex;',
    '.sd-footer{background:#0d1f2d;padding:12px 30px;display:flex;flex-shrink:0;'
  );
}

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Footer now always visible at bottom');
