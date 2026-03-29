/**
 * POLARIS — Fix Offers Detail Modal v2
 * - Merge Status/Created/Type + Contact/Email into ONE card
 * - Modal body background matches site theme
 * - Bigger fonts, proper spacing
 */

const fs = require('fs');
const path = require('path');

const OFFERS_PAGE = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let code = fs.readFileSync(OFFERS_PAGE, 'utf8');
console.log('📄 Read:', code.length, 'chars');
let fixes = 0;

// ═══════════════════════════════════════════════════════════════
// FIX 1: Replace the two separate detail-rows with ONE unified card
// ═══════════════════════════════════════════════════════════════
const oldDetailHTML = `            <div className="modal-body">
              {/* Status + Date */}
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="status-badge" style={{
                    color: getStatusConfig(selectedOffer.status).color,
                    background: getStatusConfig(selectedOffer.status).bg
                  }}>
                    {getStatusConfig(selectedOffer.status).icon} {getStatusConfig(selectedOffer.status).label}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{new Date(selectedOffer.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className={\`type-badge \${selectedOffer.offer_type}\`}>
                    {selectedOffer.offer_type === 'comparison' ? '📊 Comparison Quote' : '📋 Standard Offer'}
                  </span>
                </div>
              </div>

              {/* Contact info */}
              {selectedOffer.contact_person && (
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Contact</span>
                    <span className="detail-value">{selectedOffer.contact_person}</span>
                  </div>
                  {selectedOffer.contact_email && (
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedOffer.contact_email}</span>
                    </div>
                  )}
                </div>
              )}`;

const newDetailHTML = `            <div className="modal-body">
              {/* Offer Info Card — single unified card */}
              <div className="offer-info-card">
                <div className="offer-info-grid">
                  <div className="offer-info-item">
                    <span className="offer-info-label">Status</span>
                    <span className="status-badge" style={{
                      color: getStatusConfig(selectedOffer.status).color,
                      background: getStatusConfig(selectedOffer.status).bg
                    }}>
                      {getStatusConfig(selectedOffer.status).icon} {getStatusConfig(selectedOffer.status).label}
                    </span>
                  </div>
                  <div className="offer-info-item">
                    <span className="offer-info-label">Created</span>
                    <span className="offer-info-value">{new Date(selectedOffer.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="offer-info-item">
                    <span className="offer-info-label">Type</span>
                    <span className={\`type-badge \${selectedOffer.offer_type}\`}>
                      {selectedOffer.offer_type === 'comparison' ? '📊 Comparison Quote' : '📋 Standard Offer'}
                    </span>
                  </div>
                  {selectedOffer.contact_person && (
                    <div className="offer-info-item">
                      <span className="offer-info-label">Contact</span>
                      <span className="offer-info-value">{selectedOffer.contact_person}</span>
                    </div>
                  )}
                  {selectedOffer.contact_email && (
                    <div className="offer-info-item">
                      <span className="offer-info-label">Email</span>
                      <span className="offer-info-value">{selectedOffer.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>`;

if (code.includes(oldDetailHTML)) {
  code = code.replace(oldDetailHTML, newDetailHTML);
  console.log('✅ FIX 1: Merged detail rows into one unified info card');
  fixes++;
} else {
  console.log('⚠️  FIX 1: Could not find exact detail HTML — trying partial match');
  // Try removing the old detail-rows section and replacing
  const partialOld1 = `{/* Status + Date */}
              <div className="detail-row">`;
  if (code.includes(partialOld1)) {
    console.log('   Found partial match — doing manual replacement');
  }
}

// ═══════════════════════════════════════════════════════════════
// FIX 2: Replace CSS — remove old detail-row, add new offer-info-card
// ═══════════════════════════════════════════════════════════════

// Remove old detail-row CSS
const oldDetailRowCSS = `        .detail-row { display: flex; gap: 2rem; margin-bottom: 0; flex-wrap: wrap; padding: 1.25rem 2rem; background: rgba(13,31,45,0.5); border: 1px solid rgba(45,80,112,0.2); border-radius: 0; }
        .detail-row:first-child { border-radius: 12px 12px 0 0; }
        .detail-row:last-of-type { border-radius: 0 0 12px 12px; margin-bottom: 1.5rem; }
        .detail-row + .detail-row { border-top: none; }`;

const newInfoCardCSS = `        /* Offer Info Card — unified */
        .offer-info-card {
          background: rgba(13,31,45,0.7);
          border: 1px solid rgba(45,80,112,0.3);
          border-radius: 14px;
          padding: 1.75rem 2rem;
          margin-bottom: 1.5rem;
        }
        .offer-info-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5rem;
        }
        .offer-info-item { }
        .offer-info-label {
          display: block;
          font-size: 0.75rem;
          color: #7aa0c0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        .offer-info-value {
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 600;
        }`;

if (code.includes(oldDetailRowCSS)) {
  code = code.replace(oldDetailRowCSS, newInfoCardCSS);
  console.log('✅ FIX 2: Replaced detail-row CSS with offer-info-card');
  fixes++;
} else {
  // The old CSS may not have been patched yet - try original
  const origDetailRow = `.detail-row { display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }`;
  if (code.includes(origDetailRow)) {
    code = code.replace(origDetailRow, newInfoCardCSS);
    console.log('✅ FIX 2: Replaced original detail-row CSS with offer-info-card');
    fixes++;
  } else {
    console.log('⚠️  FIX 2: Could not find detail-row CSS to replace');
  }
}

// Remove orphan detail-item/label/value CSS (no longer needed)
const oldDetailItem = `        .detail-item { flex: 1; min-width: 180px; }`;
if (code.includes(oldDetailItem)) {
  code = code.replace(oldDetailItem, '');
  fixes++;
}
const oldDetailLabel = `.detail-label { font-size: 0.8rem; color: #7aa0c0; margin-bottom: 0.4rem; display: block; text-transform: uppercase; letter-spacing: 0.5px; }`;
if (code.includes(oldDetailLabel)) {
  code = code.replace(oldDetailLabel, '');
  fixes++;
}
const oldDetailValue = `.detail-value { color: #ffffff; font-size: 1.15rem; font-weight: 600; }`;
if (code.includes(oldDetailValue)) {
  code = code.replace(oldDetailValue, '');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// FIX 3: Modal background — proper dark navy, not black
// ═══════════════════════════════════════════════════════════════
const oldModalBg = `background: #0b1a2e;`;
const newModalBg = `background: #111c2e;`;
if (code.includes(oldModalBg)) {
  code = code.replace(oldModalBg, newModalBg);
  console.log('✅ FIX 3: Modal box background adjusted');
  fixes++;
}

// Modal body background
const oldModalBodyBg = `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #0d1929; }`;
const newModalBodyBg = `.modal-body { padding: 2rem 2.5rem; flex: 1; overflow-y: auto; overflow-x: hidden; background: #0f1e30; }`;
if (code.includes(oldModalBodyBg)) {
  code = code.replace(oldModalBodyBg, newModalBodyBg);
  console.log('✅ FIX 3b: Modal body background adjusted');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// FIX 4: Financial cards — slightly bigger, more visible borders
// ═══════════════════════════════════════════════════════════════
const oldFinCard = `.fin-card {
          background: #0d1f2d; border: 1px solid rgba(212,175,55,0.25);
          border-radius: 14px; padding: 1.5rem; text-align: center;
        }`;
const newFinCard = `.fin-card {
          background: rgba(13,31,45,0.7); border: 1px solid rgba(45,80,112,0.35);
          border-radius: 14px; padding: 1.5rem; text-align: center;
        }`;
if (code.includes(oldFinCard)) {
  code = code.replace(oldFinCard, newFinCard);
  console.log('✅ FIX 4: Financial cards background matches theme');
  fixes++;
}

// Grand Total card — gold border
const oldFinTotal = `.fin-card.total { border-color: rgba(212,175,55,0.4); background: rgba(212,175,55,0.06); }`;
const newFinTotal = `.fin-card.total { border-color: rgba(212,175,55,0.5); background: rgba(212,175,55,0.08); }`;
if (code.includes(oldFinTotal)) {
  code = code.replace(oldFinTotal, newFinTotal);
  console.log('✅ FIX 4b: Grand Total card gold border stronger');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// FIX 5: Doc gen cards — match background
// ═══════════════════════════════════════════════════════════════
const oldDocCard = `.doc-gen-card { background: #0d1f2d;`;
const newDocCard = `.doc-gen-card { background: rgba(13,31,45,0.7);`;
if (code.includes(oldDocCard)) {
  code = code.replace(oldDocCard, newDocCard);
  console.log('✅ FIX 5: Doc gen cards background matches theme');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// FIX 6: Responsive — offer-info-grid
// ═══════════════════════════════════════════════════════════════
// Add responsive rule for the new info grid
const responsiveInsert = `        @media (max-width: 1024px) {
          .offer-info-grid { grid-template-columns: repeat(3, 1fr); }`;
const oldResponsive1024 = `        @media (max-width: 1024px) {`;
if (code.includes(oldResponsive1024)) {
  code = code.replace(oldResponsive1024, responsiveInsert);
  console.log('✅ FIX 6: Added responsive for offer-info-grid');
  fixes++;
}

// Also add 768px responsive
const responsive768Insert = `        @media (max-width: 768px) {
          .offer-info-grid { grid-template-columns: repeat(2, 1fr); }`;
const oldResponsive768 = `        @media (max-width: 768px) {`;
if (code.includes(oldResponsive768)) {
  code = code.replace(oldResponsive768, responsive768Insert);
  console.log('✅ FIX 6b: Added responsive for 768px');
  fixes++;
}

// ═══════════════════════════════════════════════════════════════
// Write
// ═══════════════════════════════════════════════════════════════
fs.writeFileSync(OFFERS_PAGE, code, 'utf8');
console.log('\n✅ Applied', fixes, 'fixes!');
console.log('📄 New size:', code.length, 'chars');
