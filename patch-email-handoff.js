// patch-email-handoff.js — Adds Send Documents → Email Center handoff
// Reads localStorage when ?sendDocs=true, auto-fills Compose tab with attachments
const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src', 'app', '(admin)', 'email', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// ═══════════════════════════════════════════════════════════════
// 1. Add useSearchParams import
// ═══════════════════════════════════════════════════════════════
if (!content.includes('useSearchParams')) {
  content = content.replace(
    "import { useEffect } from 'react';",
    "import { useEffect } from 'react';\nimport { useSearchParams } from 'next/navigation';"
  );
  console.log('✅ Added useSearchParams import');
}

// ═══════════════════════════════════════════════════════════════
// 2. Add sendDocsAttachments state + useSearchParams + useEffect
//    right after the editorHtml state
// ═══════════════════════════════════════════════════════════════
const editorStateLine = "const [editorHtml, setEditorHtml] = React.useState('');";
if (content.includes(editorStateLine) && !content.includes('sendDocsAttachments')) {
  const handoffCode = `const [editorHtml, setEditorHtml] = React.useState('');
  const [sendDocsAttachments, setSendDocsAttachments] = React.useState<Array<{type: string; name: string; key: string}>>([]);
  const searchParams = useSearchParams();

  // ═══ Send Documents Handoff ═══
  useEffect(() => {
    if (searchParams.get('sendDocs') === 'true') {
      try {
        const raw = localStorage.getItem('polaris_send_docs');
        if (raw) {
          const data = JSON.parse(raw);
          // Switch to Compose tab
          ec.setActiveTab('compose');

          // Auto-select contract template
          ec.handleTemplateChange('contract_01');

          // Build attachments list
          const atts: Array<{type: string; name: string; key: string}> = [];
          const docNames: Record<string, string> = {
            nda: '🔒 NDA', dpa: '🛡️ DPA', asa: '📋 ASA',
            proposal: '💼 Proposal', comparison_quote: '📊 Comparison Quote',
          };
          const progNames: Record<string, string> = {
            silver: '🥈 Silver Brochure', gold: '🥇 Gold Brochure',
            goldplus: '🥇+ Gold+ Brochure', goldplusplus: '🥇++ Gold++ Brochure',
            platinum: '💎 Platinum Brochure', diamond: '💠 Diamond Brochure',
            dental: '🦷 Dental Brochure',
          };

          if (data.docs) {
            data.docs.forEach((d: string) => {
              atts.push({ type: 'doc', name: docNames[d] || d, key: d });
            });
          }
          if (data.programs) {
            data.programs.forEach((p: string) => {
              atts.push({ type: 'brochure', name: progNames[p] || p, key: p });
            });
          }
          setSendDocsAttachments(atts);

          // Set subject with client name
          if (data.clientName) {
            ec.setSubject(\`Contract Documents - \${data.clientName}\`);
          }

          // Clean up
          localStorage.removeItem('polaris_send_docs');
          // Remove ?sendDocs from URL without reload
          window.history.replaceState({}, '', '/email');
        }
      } catch (e) {
        console.error('Send Docs handoff error:', e);
      }
    }
  }, [searchParams]);`;

  content = content.replace(editorStateLine, handoffCode);
  console.log('✅ Added sendDocsAttachments state + handoff useEffect');
}

// ═══════════════════════════════════════════════════════════════
// 3. Add Attachments section in Compose tab — before Message Editor
// ═══════════════════════════════════════════════════════════════
const messageEditorMarker = `<div className="em-form-group">
            <label>📝 Message Editor</label>`;
if (content.includes(messageEditorMarker) && !content.includes('sendDocsAttachments.length')) {
  const attachmentsSection = `{/* ═══ ATTACHMENTS FROM SEND DOCUMENTS ═══ */}
          {sendDocsAttachments.length > 0 && (
            <div className="em-form-group">
              <label>📎 Attached Documents ({sendDocsAttachments.length})</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8, padding: 12,
                background: 'rgba(10,22,40,0.5)',
                border: '1px solid rgba(45,80,112,0.4)',
                borderRadius: 10,
              }}>
                {sendDocsAttachments.map((att, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    background: att.type === 'doc'
                      ? 'rgba(76,175,80,0.1)' : 'rgba(33,150,243,0.1)',
                    border: \`1px solid \${att.type === 'doc'
                      ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)'}\`,
                    borderRadius: 8, fontSize: '0.85rem', color: '#e0e8f0',
                  }}>
                    <span>{att.name}</span>
                    <button onClick={() => setSendDocsAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      style={{
                        marginLeft: 'auto', background: 'rgba(231,76,60,0.2)',
                        border: 'none', color: '#ef5350', borderRadius: 4,
                        cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem',
                      }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#7aa0c0' }}>
                📨 Documents from Send Documents modal • Files will be attached from Google Drive
              </div>
            </div>
          )}

          ${messageEditorMarker}`;

  content = content.replace(messageEditorMarker, attachmentsSection);
  console.log('✅ Added Attachments section in Compose tab');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('\n🎉 Email handoff patch complete!');
