const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'components', 'offers', 'send-documents-modal.tsx');
let c = fs.readFileSync(f, 'utf8');

// 1. Reduce section header padding
c = c.replace(
  ".sd-section-hdr{background:linear-gradient(135deg,#1e3a5f,#2a4a6f);padding:16px 20px;",
  ".sd-section-hdr{background:linear-gradient(135deg,#1e3a5f,#2a4a6f);padding:12px 18px;"
);

// 2. Reduce section body padding
c = c.replace(
  ".sd-section-body{padding:20px}",
  ".sd-section-body{padding:14px 18px}"
);

// 3. Reduce doc items padding/min-height
c = c.replace(
  "padding:16px 18px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:12px;cursor:pointer;transition:all 0.3s;min-height:60px",
  "padding:12px 14px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:10px;cursor:pointer;transition:all 0.3s;min-height:50px"
);

// 4. Reduce program items padding
c = c.replace(
  ".sd-prog-item{display:flex;flex-direction:column;align-items:center;padding:14px 10px;",
  ".sd-prog-item{display:flex;flex-direction:column;align-items:center;padding:10px 8px;"
);

// 5. Reduce prog icon size
c = c.replace(
  ".sd-prog-icon{font-size:1.8rem;margin-bottom:6px}",
  ".sd-prog-icon{font-size:1.5rem;margin-bottom:4px}"
);

// 6. Reduce body gap
c = c.replace(
  "background:#3d5a80;display:flex;flex-direction:column;gap:20px",
  "background:#3d5a80;display:flex;flex-direction:column;gap:14px"
);

// 7. Reduce body padding
c = c.replace(
  "padding:25px 30px;background:#3d5a80",
  "padding:20px 25px;background:#3d5a80"
);

// 8. Reduce header padding
c = c.replace(
  ".sd-header{background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:20px 30px;",
  ".sd-header{background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:14px 25px;"
);

// 9. Reduce title size slightly
c = c.replace(
  ".sd-title{color:white;margin:0;font-size:1.6rem;",
  ".sd-title{color:white;margin:0;font-size:1.4rem;"
);

// 10. Reduce checkbox size in programs
c = c.replace(
  ".sd-prog-item input[type=\"checkbox\"]{width:22px;height:22px;margin-bottom:8px",
  ".sd-prog-item input[type=\"checkbox\"]{width:18px;height:18px;margin-bottom:5px"
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ All sections made more compact — should fit on screen now');
