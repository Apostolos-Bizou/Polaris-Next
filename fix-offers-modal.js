/**
 * POLARIS — Fix Offers Detail Modal Issues
 * - Remove duplicate Send Documents button
 * - Grand Total inline (5th card, not full-width)
 * - Better detail-row layout (bigger fonts, padding, borders)
 * - Better modal-body background
 */

const fs = require('fs');
const path = require('path');

const OFFERS_PAGE = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let code = fs.readFileSync(OFFERS_PAGE, 'utf8');
console.log('📄 Read:', code.length, 'chars');
let fixes = 0;

// ═══════════════════════════════════════════════════════════════
// FIX 1: Remove duplicate "Send Documents" button (the TODO one)
// ═══════════════════════════════════════════════════════════════
const duplicateBtn = `                <button className="modal-btn send" onClick={() => { /* TODO: Open Send Documents modal */ }}>
                  📨 Send Documents
                </button>`;
if (code.includes(duplicateBtn)) {
  code = code.replace(duplicateBtn, '');
  console.log('✅ FIX 1: Removed duplicate Send Documents button');
  fixes++;
} else {
  // Try alternative match
  const alt = /\s*<button className="modal-btn send" onClick=\{[^}]*TODO[^}]*\}[^>]*>\s*📨 Send Documents\s*<\/button>/;
  if (alt.test(code)) {
    code = code.replace(alt, '');
    console.log('✅ FIX 1: Removed duplicate Send Documents button (alt match)');
    fixes++;
  } else {
    console.log('⚠️  FIX 1: Could not find duplicate button');
  }
}

// ═══════════════════════════════════════════════════════════════
// FIX 2: Grand Total — change from full-width to inline 5th card
// ═══════════════════════════════════════════════════════════════
const oldFinTotal = `.fin-card.total { border-color: rgba(212,175,55,0.4); background: rgba(212,175,55,0.06); grid-column: 1 / -1; }`;
const newFinTotal = `.fin-card.total { border-color: rgba(212,175,55,0.4); background: rgba(212,175,55,0.06); }`;
if (code.includes(oldFinTotal)) {
  code = code.replace(oldFinTotal, newFinTotal);
  console.log('✅ FIX 2: Grand Total now inline (removed grid-column span)');
  fixes++;
} else {
  console.log('⚠️  FIX 2: Could not find fin-card.total CSS');
}

// Also change grid to 5 columns
const oldFinGrid = `.financial-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }`;
const newFinGrid = `.financial-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.25rem; }`;
if (code.includes(oldFinGrid)) {
  code = code.replace(oldFinGrid, newFinGrid);
  console.log('✅ FIX 2b: Financial grid now 5 columns');
  fixes++;
} else {
  console.log('⚠️  FIX 2b: Could not find financial-grid CSS');
}

// ═══════════════════════════════════════════════════════════════
// FIX 3: Detail row — bigger labels, padding, proper sections
// ═══════════════════════════════════════════════════════════════
const oldDetailRow = `.detail-row { display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }`;
const newDetailRow = `.detail-row { display: flex; gap: 2rem; margin-bottom: 0; flex-wrap: wrap; padding: 1.25rem 2rem; background: rgba(13,31,45,0.5); border: 1px solid rgba(45,80,112,0.2); border-radius: 0; }
        .detail-row:first-child { border-radius: 12px 12px 0 0; }
        .detail-row:last-of-type { border-radius: 0 0 12px 12px; margin-bottom: 1.5rem; }
        .detail-row + .detail-row { border-top: none; }`;
if (code.includes(oldDetailRow)) {
  code = code.replace(oldDetailRow, newDetailRow);
  console.log('✅ FIX 3: Detail rows now have background, padding, borders');
  fixes++;
} else {
  console.log('⚠️  FIX 3: Could not find detail-row CSS');
}

const oldDetailLabel = `.detail-label { font-size: 0.95rem; color: #667788; margin-bottom: 0.3rem; display: block; }`;
const newDetailLabel = `.detail-label { font-size: 0.8rem; color: #7aa0c0; margin-bottom: 0.4rem; display: block; text-transform: uppercase; letter-spacing: 0.5px; }`;
if (code.includes(oldDetailLabel)) {
  code = code.replace(oldDetailLabel, newDetailLabel);
  console.log('✅ FIX 3b: Detail labels now uppercase with better color');
  fixes++;
} else {
  console.log('⚠️  FIX 3b: Could not find detail-label CSS');
}

const oldDetailValue = `.detail-value { color: #ffffff; font-size: 1.1rem; font-weight: 600; }`;
const newDetailValue = `.detail-value { color: #ffffff; font-size: 1.15rem; font-weight: 600; }`;
if (code.includes(oldDetailValue)) {
  code = code.replace(oldDetailValue, newDetailValue);
  console.log('✅ FIX 3c: Detail values slightly larger');
  fixes++;
} else {
  console.log('⚠️  FIX 3c: Could not find detail-value CSS');
}

// ═══════════════════════════════════════════════════════════════
// FIX 4: Modal body background — not pure black
// ═══════════════════════════════════════════════════════════════
const oldModalBody = `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; }`;
const newModalBody = `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #0d1929; }`;
if (code.includes(oldModalBody)) {
  code = code.replace(oldModalBody, newModalBody);
  console.log('✅ FIX 4: Modal body now dark navy instead of pure black');
  fixes++;
} else {
  console.log('⚠️  FIX 4: Could not find modal-body CSS');
}

// ═══════════════════════════════════════════════════════════════
// FIX 5: Financial responsive — adjust for 5 cols
// ═══════════════════════════════════════════════════════════════
const oldFinResp1 = `.financial-grid { grid-template-columns: repeat(2, 1fr); }`;
const newFinResp1 = `.financial-grid { grid-template-columns: repeat(3, 1fr); }`;
if (code.includes(oldFinResp1)) {
  code = code.replace(oldFinResp1, newFinResp1);
  console.log('✅ FIX 5: Financial grid responsive (3 cols on tablet)');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// Write
// ═══════════════════════════════════════════════════════════════
fs.writeFileSync(OFFERS_PAGE, code, 'utf8');
console.log(`\n✅ Applied ${fixes} fixes!`);
console.log('📄 New size:', code.length, 'chars');
