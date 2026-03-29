const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');
let c = fs.readFileSync(f, 'utf8');
console.log('📄 Read:', c.length, 'chars');
let fixes = 0;

// 1. Add import
if (!c.includes('AcceptOfferModal')) {
  const lastImport = c.lastIndexOf("import ");
  const endLine = c.indexOf('\n', c.indexOf(';', lastImport));
  c = c.slice(0, endLine + 1) + "\nimport AcceptOfferModal from '@/components/offers/accept-offer-modal';\n" + c.slice(endLine + 1);
  console.log('✅ Added AcceptOfferModal import');
  fixes++;
}

// 2. Add state for accept modal
if (!c.includes('showAccept')) {
  const hookLine = "const sendDocs = useSendDocuments();";
  const idx = c.indexOf(hookLine);
  if (idx !== -1) {
    const endLine = c.indexOf('\n', idx);
    c = c.slice(0, endLine + 1) + "  const [showAccept, setShowAccept] = useState(false);\n  const [acceptOffer, setAcceptOfferState] = useState<Offer | null>(null);\n" + c.slice(endLine + 1);
    console.log('✅ Added showAccept state');
    fixes++;
  }
}

// 3. Add openAcceptOffer function
if (!c.includes('openAcceptOffer')) {
  const closeDetailLine = "const closeDetail";
  const idx = c.indexOf(closeDetailLine);
  if (idx !== -1) {
    const endLine = c.indexOf('\n', c.indexOf(';', idx));
    const fn = `\n  const openAcceptOffer = (offer: Offer) => { setAcceptOfferState(offer); setShowAccept(true); closeDetail(); };\n`;
    c = c.slice(0, endLine + 1) + fn + c.slice(endLine + 1);
    console.log('✅ Added openAcceptOffer function');
    fixes++;
  }
}

// 4. Wire up the existing Accept Offer button in modal-actions
const oldAcceptBtn = `<button className="modal-btn accept" onClick={() => { /* TODO: Accept offer flow */ }}>`;
if (c.includes(oldAcceptBtn)) {
  c = c.replace(oldAcceptBtn, `<button className="modal-btn accept" onClick={() => openAcceptOffer(selectedOffer)}>`)
  console.log('✅ Wired Accept Offer button');
  fixes++;
} else {
  // Try simpler match
  const alt = /onClick=\{[^}]*TODO.*Accept offer/;
  if (alt.test(c)) {
    c = c.replace(alt, 'onClick={() => openAcceptOffer(selectedOffer)}');
    console.log('✅ Wired Accept Offer button (alt match)');
    fixes++;
  } else {
    console.log('⚠️  Could not find Accept Offer TODO button');
  }
}

// 5. Add AcceptOfferModal component in JSX
if (!c.includes('<AcceptOfferModal')) {
  const sendDocsModal = '<SendDocumentsModal';
  const idx = c.indexOf(sendDocsModal);
  if (idx !== -1) {
    const insertBefore = c.lastIndexOf('\n', idx);
    const modal = `\n      {/* Accept Offer Modal */}\n      {showAccept && acceptOffer && (\n        <AcceptOfferModal\n          offer={acceptOffer}\n          onClose={() => { setShowAccept(false); setAcceptOfferState(null); }}\n          onAccepted={(offerId) => {\n            setOffers(prev => prev.map(o => o.offer_id === offerId ? { ...o, status: 'accepted' } : o));\n          }}\n        />\n      )}\n`;
    c = c.slice(0, insertBefore) + modal + c.slice(insertBefore);
    console.log('✅ Added AcceptOfferModal to JSX');
    fixes++;
  }
}

fs.writeFileSync(f, c, 'utf8');
console.log('\n✅ Applied', fixes, 'fixes!');
console.log('📄 New size:', c.length, 'chars');
