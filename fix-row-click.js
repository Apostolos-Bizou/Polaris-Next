const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');

// Fix: Send docs button needs stopPropagation
c = c.replace(
  `onClick={() => openSendDocs(offer)} title="Send Documents">📨</button>`,
  `onClick={(e) => { e.stopPropagation(); openSendDocs(offer); }} title="Send Documents">📨</button>`
);

// Fix: View button also (already works but let's be safe)
c = c.replace(
  `onClick={() => openDetail(offer)} title="View Details">👁️</button>`,
  `onClick={(e) => { e.stopPropagation(); openDetail(offer); }} title="View Details">👁️</button>`
);

// Fix: Send Offer button
c = c.replace(
  `className="action-btn send" title="Send Offer">📧</button>`,
  `className="action-btn send" onClick={(e) => e.stopPropagation()} title="Send Offer">📧</button>`
);

// Fix: Docs button
c = c.replace(
  `className="action-btn docs" title="Documents">📄</button>`,
  `className="action-btn docs" onClick={(e) => e.stopPropagation()} title="Documents">📄</button>`
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ All action buttons now have stopPropagation — row click won\'t interfere');
