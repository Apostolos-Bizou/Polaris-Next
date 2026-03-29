const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// The current code has: <SendDocumentsModal sd={sendDocs} />
// But the component might be using its own internal hook
// Let's check what we have
if (c.includes('<SendDocumentsModal sd={sendDocs}')) {
  console.log('✅ Already has sd={sendDocs} prop — good');
} else if (c.includes('<SendDocumentsModal')) {
  // Replace with prop version
  c = c.replace('<SendDocumentsModal />', '<SendDocumentsModal sd={sendDocs} />');
  c = c.replace('<SendDocumentsModal/>', '<SendDocumentsModal sd={sendDocs} />');
  console.log('✅ Added sd={sendDocs} prop to SendDocumentsModal');
} else {
  console.log('⚠️  SendDocumentsModal not found in JSX');
}

fs.writeFileSync(f, c, 'utf8');
console.log('📄 Saved:', c.length, 'chars');
