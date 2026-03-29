const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// Find the current send-docs button line
const lines = c.split('\n');
let fixed = false;

for (let i = 0; i < lines.length; i++) {
  // Find the send-docs button in the table (not in modal-actions)
  if (lines[i].includes('action-btn send-docs') && lines[i].includes('📨') && !lines[i].includes('Send Documents</button>')) {
    console.log('Found line', i+1, ':', lines[i].trim().substring(0, 100));
    
    // Replace the entire line with correct code
    lines[i] = '                        <button className="action-btn send-docs" onClick={(e) => { e.stopPropagation(); openSendDocs(offer); }} title="Send Documents">📨</button>';
    console.log('✅ Fixed send-docs button with onClick + stopPropagation');
    fixed = true;
    break;
  }
}

if (!fixed) {
  console.log('⚠️  Could not find send-docs button line');
  // Search for any line with send-docs
  lines.forEach((line, i) => {
    if (line.includes('send-docs')) console.log('  Line', i+1, ':', line.trim().substring(0, 120));
  });
}

// Also fix view button
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('action-btn view') && lines[i].includes('👁️')) {
    lines[i] = '                        <button className="action-btn view" onClick={(e) => { e.stopPropagation(); openDetail(offer); }} title="View Details">👁️</button>';
    console.log('✅ Fixed view button with stopPropagation');
    break;
  }
}

c = lines.join('\n');
fs.writeFileSync(f, c, 'utf8');
console.log('📄 Saved:', c.length, 'chars');
