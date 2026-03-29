const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'components', 'offers', 'send-documents-modal.tsx');
let c = fs.readFileSync(f, 'utf8');

// Find the footer actions and add Preview + Save Draft before the Email Center button
c = c.replace(
  `<button className="sd-btn cancel" onClick={sd.closeModal}>Cancel</button>
        <button className="sd-btn email" onClick={openInEmailCenter} disabled={sd.attachmentCount===0}>
          📧 Open in Email Center
        </button>`,
  `<button className="sd-btn cancel" onClick={sd.closeModal}>Cancel</button>
        <button className="sd-btn preview" onClick={() => alert('Preview coming soon')}>👁️ Preview Email</button>
        <button className="sd-btn draft" onClick={sd.saveDraft} disabled={sd.attachmentCount===0}>💾 Save Draft</button>
        <button className="sd-btn email" onClick={openInEmailCenter} disabled={sd.attachmentCount===0}>
          📧 Open in Email Center
        </button>`
);

// Add CSS for preview and draft buttons
c = c.replace(
  `.sd-btn.cancel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6)}.sd-btn.cancel:hover{background:rgba(255,255,255,0.1)}`,
  `.sd-btn.cancel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6)}.sd-btn.cancel:hover{background:rgba(255,255,255,0.1)}
.sd-btn.preview{background:rgba(45,80,112,0.5);border:1px solid rgba(45,80,112,0.6);color:#b8d4e8}.sd-btn.preview:hover{background:rgba(45,80,112,0.7);transform:translateY(-2px)}
.sd-btn.draft{background:linear-gradient(135deg,#f39c12,#e67e22);color:white}.sd-btn.draft:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 20px rgba(243,156,18,0.4)}`
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Added Preview Email + Save Draft buttons');
