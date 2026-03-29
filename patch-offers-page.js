/**
 * POLARIS — Send Documents Modal Integration Script
 * 
 * Τρέξε αυτό το script στο PowerShell:
 *   node patch-offers-page.js
 * 
 * Θα κάνει patch το offers page.tsx ώστε να ενσωματώσει
 * το Send Documents Modal.
 */

const fs = require('fs');
const path = require('path');

const OFFERS_PAGE = path.join(__dirname, 'src', 'app', '(admin)', 'offers', 'page.tsx');

if (!fs.existsSync(OFFERS_PAGE)) {
  console.error('❌ Offers page not found at:', OFFERS_PAGE);
  console.log('   Make sure you run this script from the polaris root directory.');
  process.exit(1);
}

let code = fs.readFileSync(OFFERS_PAGE, 'utf8');
console.log('📄 Read offers page.tsx —', code.length, 'chars');

// ═══════════════════════════════════════════════════════════════
// 1. Add imports at the top
// ═══════════════════════════════════════════════════════════════
const importLines = `import SendDocumentsModal from '@/components/offers/send-documents-modal';
import { useSendDocuments } from '@/hooks/use-send-documents';
import type { SendDocsOffer } from '@/hooks/use-send-documents';`;

if (code.includes('useSendDocuments')) {
  console.log('⚠️  Send Documents imports already exist — skipping.');
} else {
  // Add after the last import line
  const lastImport = code.lastIndexOf("import ");
  if (lastImport === -1) {
    console.error('❌ Could not find import statements');
    process.exit(1);
  }
  const endOfLastImport = code.indexOf('\n', code.indexOf(';', lastImport));
  code = code.slice(0, endOfLastImport + 1) + '\n' + importLines + '\n' + code.slice(endOfLastImport + 1);
  console.log('✅ Added imports');
}

// ═══════════════════════════════════════════════════════════════
// 2. Add useSendDocuments hook
// ═══════════════════════════════════════════════════════════════
const hookLine = `\n  // ── Send Documents hook ──\n  const sendDocs = useSendDocuments();\n`;

if (code.includes('const sendDocs = useSendDocuments()')) {
  console.log('⚠️  sendDocs hook already exists — skipping.');
} else {
  // Add after the first useState or useEffect
  const hookInsertPoint = code.indexOf('const [showDetail');
  if (hookInsertPoint === -1) {
    // Try another common state var
    const alt = code.indexOf('const [selectedOffer');
    if (alt !== -1) {
      const endLine = code.indexOf('\n', alt);
      code = code.slice(0, endLine + 1) + hookLine + code.slice(endLine + 1);
      console.log('✅ Added sendDocs hook (after selectedOffer)');
    } else {
      console.log('⚠️  Could not find insertion point for hook — add manually');
    }
  } else {
    const endLine = code.indexOf('\n', hookInsertPoint);
    code = code.slice(0, endLine + 1) + hookLine + code.slice(endLine + 1);
    console.log('✅ Added sendDocs hook (after showDetail)');
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. Add openSendDocs function
// ═══════════════════════════════════════════════════════════════
const openSendDocsFunc = `
  // ── Open Send Documents modal ────────────────────────────────
  const openSendDocs = async (offerObj: any) => {
    const isComparison = offerObj.offer_type === 'comparison' || (offerObj.offer_id && offerObj.offer_id.startsWith('CQ-'));
    const programs: string[] = [];
    try {
      if (isComparison && offerObj.comparison_data) {
        let cd = typeof offerObj.comparison_data === 'string' ? JSON.parse(offerObj.comparison_data) : offerObj.comparison_data;
        if (Array.isArray(cd)) cd.forEach((o: any) => { const n = o.planName || o.plan_name || ''; if (n && !programs.includes(n)) programs.push(n); if (o.hasDental && !programs.includes('Dental')) programs.push('Dental'); });
      } else if (offerObj.items) {
        const items = typeof offerObj.items === 'string' ? JSON.parse(offerObj.items) : offerObj.items;
        if (Array.isArray(items)) items.forEach((it: any) => { const n = it.plan_name || it.program || ''; if (n && !programs.includes(n)) programs.push(n); });
      }
    } catch(e) {}
    if ((offerObj.includes_dental === true || offerObj.includes_dental === 'true') && !programs.some((p: string) => p.toLowerCase().includes('dental'))) programs.push('Dental');
    
    const sd: SendDocsOffer = {
      offerId: offerObj.offer_id, clientId: offerObj.client_id,
      clientName: (offerObj.client_name || 'Unknown').replace(/^[\\s]*[\u{1F3E2}\u{2514}\\s]+/gu, '').trim(),
      contactName: offerObj.contact_person || offerObj.contact_name || 'Unknown Contact',
      contactEmail: offerObj.contact_email || '',
      programs, items: offerObj.items, status: offerObj.status,
      totalMembers: offerObj.total_members, grandTotal: offerObj.grand_total_usd,
      isComparison, offer: offerObj,
    };
    sendDocs.openModal(sd);
  };
`;

if (code.includes('openSendDocs')) {
  console.log('⚠️  openSendDocs function already exists — skipping.');
} else {
  // Add after closeDetail
  const closeDetailIdx = code.indexOf('const closeDetail');
  if (closeDetailIdx !== -1) {
    const endLine = code.indexOf('\n', code.indexOf(';', closeDetailIdx));
    code = code.slice(0, endLine + 1) + openSendDocsFunc + code.slice(endLine + 1);
    console.log('✅ Added openSendDocs function');
  } else {
    console.log('⚠️  Could not find closeDetail — add openSendDocs manually');
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. Add 📨 Send button to table action-group
// ═══════════════════════════════════════════════════════════════
// Look for the action buttons in the table row
if (code.includes('openSendDocs(offer)')) {
  console.log('⚠️  Send button in table already exists — skipping.');
} else {
  // Find the view button in the table
  const viewBtnIdx = code.indexOf('onClick={() => openDetail(offer)}');
  if (viewBtnIdx !== -1) {
    // Find the end of that button tag
    const afterViewBtn = code.indexOf('</button>', viewBtnIdx);
    if (afterViewBtn !== -1) {
      const insertAt = afterViewBtn + '</button>'.length;
      const sendBtn = `\n                        <button className="action-btn send-docs" onClick={() => openSendDocs(offer)} title="Send Documents">📨</button>`;
      code = code.slice(0, insertAt) + sendBtn + code.slice(insertAt);
      console.log('✅ Added 📨 Send button to table');
    }
  } else {
    console.log('⚠️  Could not find view button in table — add Send button manually');
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. Add Send Documents button to detail modal
// ═══════════════════════════════════════════════════════════════
if (code.includes('Send Documents') && code.includes('closeDetail(); openSendDocs')) {
  console.log('⚠️  Send Documents button in modal already exists — skipping.');
} else {
  const modalActionsIdx = code.indexOf('modal-actions');
  if (modalActionsIdx !== -1) {
    // Find the opening > of the div
    const divEnd = code.indexOf('>', modalActionsIdx);
    if (divEnd !== -1) {
      const sendDocsBtn = `\n                <button className="modal-btn send-docs" onClick={() => { closeDetail(); openSendDocs(selectedOffer); }}>📨 Send Documents</button>`;
      code = code.slice(0, divEnd + 1) + sendDocsBtn + code.slice(divEnd + 1);
      console.log('✅ Added 📨 Send Documents button to detail modal');
    }
  } else {
    console.log('⚠️  Could not find modal-actions — add button manually');
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. Add SendDocumentsModal component at end of JSX
// ═══════════════════════════════════════════════════════════════
if (code.includes('<SendDocumentsModal')) {
  console.log('⚠️  SendDocumentsModal already in JSX — skipping.');
} else {
  // Find the last closing tag before styled-jsx
  const styleJsxIdx = code.indexOf('<style jsx>');
  if (styleJsxIdx !== -1) {
    const modalJsx = `\n      {/* Send Documents Modal */}\n      <SendDocumentsModal sd={sendDocs} />\n\n      `;
    code = code.slice(0, styleJsxIdx) + modalJsx + code.slice(styleJsxIdx);
    console.log('✅ Added <SendDocumentsModal /> to JSX');
  } else {
    console.log('⚠️  Could not find <style jsx> — add SendDocumentsModal manually');
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. Add CSS for send-docs buttons
// ═══════════════════════════════════════════════════════════════
const sendDocsCss = `
        /* Send Documents button styles */
        .action-btn.send-docs {
          background: linear-gradient(135deg, #d4a843, #c49932);
          color: #1e3a5f;
        }
        .action-btn.send-docs:hover {
          box-shadow: 0 4px 15px rgba(212,168,67,0.4);
          transform: translateY(-2px);
        }
        .modal-btn.send-docs {
          background: linear-gradient(135deg, #D4AF37, #c49932);
          color: #1e3a5f;
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .modal-btn.send-docs:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(212,168,67,0.4);
        }`;

if (code.includes('.action-btn.send-docs')) {
  console.log('⚠️  Send docs CSS already exists — skipping.');
} else {
  const endStyleIdx = code.lastIndexOf('`}');
  if (endStyleIdx !== -1) {
    code = code.slice(0, endStyleIdx) + sendDocsCss + '\n      ' + code.slice(endStyleIdx);
    console.log('✅ Added send-docs CSS styles');
  }
}

// ═══════════════════════════════════════════════════════════════
// Write back
// ═══════════════════════════════════════════════════════════════
fs.writeFileSync(OFFERS_PAGE, code, 'utf8');
console.log('\n✅ Patched offers page.tsx successfully!');
console.log('📄 New size:', code.length, 'chars');
console.log('\n🔄 Restart npm run dev to see changes.');
