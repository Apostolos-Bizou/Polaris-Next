'use client';
import React, { useState, useEffect, useCallback } from 'react';

interface AcceptOfferModalProps {
  offer: any;
  onClose: () => void;
  onAccepted: (offerId: string) => void;
}

interface DocInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
  cqOnly?: boolean;
  fileId?: string;
  fileUrl?: string;
  version?: number;
}

const DOC_TYPES: DocInfo[] = [
  { key: 'nda', label: 'NDA', icon: '🔒', color: '#e74c3c', desc: 'Non-Disclosure Agreement' },
  { key: 'dpa', label: 'DPA', icon: '🛡️', color: '#f39c12', desc: 'Data Processing Agreement' },
  { key: 'asa', label: 'ASA', icon: '📋', color: '#3498db', desc: 'Administrative Services Agreement' },
  { key: 'proposal', label: 'Proposal', icon: '📄', color: '#27ae60', desc: 'Financial Proposal' },
  { key: 'comparison_quote', label: 'Comparison Quote', icon: '📊', color: '#8b5cf6', desc: 'Multi-plan comparison', cqOnly: true },
];

export default function AcceptOfferModal({ offer, onClose, onAccepted }: AcceptOfferModalProps) {
  const [notes, setNotes] = useState('');
  const [docs, setDocs] = useState<Record<string, any>>({});
  const [docsLoading, setDocsLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');

  const isComparison = offer.offer_type === 'comparison' || (offer.offer_id && offer.offer_id.startsWith('CQ-'));
  const clientName = (offer.client_name || 'Unknown').replace(/^[\s]*[🏢└─\s]+/g, '').trim();

  // ── Parse plans data ──
  const plansData = (() => {
    const plans: any[] = [];
    try {
      if (offer.items && Array.isArray(offer.items) && offer.items.length > 0) {
        offer.items.forEach((item: any) => {
          plans.push({
            planName: item.plan_name || 'Plan',
            principals: parseInt(item.principals) || 0,
            dependents: parseInt(item.dependents) || 0,
            regFee: parseFloat(item.reg_fee || 0),
            fundDeposit: parseFloat(item.fund_deposit || 0),
          });
        });
      } else if (isComparison && offer.comparison_data) {
        let cd = typeof offer.comparison_data === 'string' ? JSON.parse(offer.comparison_data) : offer.comparison_data;
        if (!Array.isArray(cd)) cd = [cd];
        cd.forEach((p: any) => {
          plans.push({
            planName: p.planName || p.plan_name || 'Plan',
            principals: parseInt(p.principals) || 0,
            dependents: parseInt(p.dependents) || 0,
            regFee: parseFloat(p.regFee || p.reg_fee || 0),
            fundDeposit: parseFloat(p.fundDeposit || p.fund_deposit || 0),
          });
        });
      }
    } catch (e) { }
    return plans;
  })();

  const totalMembers = offer.total_members || 0;
  const grandTotal = parseFloat(offer.grand_total_usd || 0);
  const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Load documents ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/proxy/getAllOffersDocuments');
        const data = await res.json();
        if (data.success && data.data && data.data[offer.offer_id]) {
          setDocs(data.data[offer.offer_id]);
        }
      } catch (e) { console.error('Load docs error:', e); }
      setDocsLoading(false);
    })();
  }, [offer.offer_id]);

  // ── Filter doc types ──
  const filteredDocTypes = DOC_TYPES.filter(dt => !dt.cqOnly || isComparison);
  const generatedCount = filteredDocTypes.filter(dt => {
    const d = docs[dt.key];
    return d && (d.fileId || d.fileUrl || typeof d === 'string');
  }).length;

  // ── Confirm accept ──
  const confirmAccept = useCallback(async () => {
    setAccepting(true);
    setStatus({ msg: 'Updating offer status...', type: 'loading' });

    const notesParam = notes.trim() ? 'Accepted by client. ' + notes.trim() : 'Accepted by client';

    try {
      const res = await fetch(`/api/proxy/updateOfferStatus?offerId=${encodeURIComponent(offer.offer_id)}&status=accepted&notes=${encodeURIComponent(notesParam)}`);
      const data = await res.json();

      if (data.success) {
        // Try to create signed documents folder
        try {
          setStatus({ msg: '📁 Creating Signed Documents folder...', type: 'loading' });
          const folderRes = await fetch('/api/proxy/ensureSignedFolder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ensureSignedFolder', offerId: offer.offer_id, clientName }),
          });
          const folderData = await folderRes.json();
          if (folderData.success && folderData.folderUrl) {
            setDriveFolderUrl(folderData.folderUrl);
          }
        } catch (e) { /* not critical */ }

        setAccepted(true);
        setStatus({ msg: 'Offer accepted successfully!', type: 'success' });
        onAccepted(offer.offer_id);
      } else {
        setStatus({ msg: '❌ ' + (data.error || 'Failed to accept'), type: 'error' });
        setAccepting(false);
      }
    } catch (e: any) {
      setStatus({ msg: '❌ Error: ' + e.message, type: 'error' });
      setAccepting(false);
    }
  }, [offer, notes, clientName, onAccepted]);

  return (
    <div className="ao-overlay" onClick={onClose}>
      <div className="ao-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ao-header">
          <h2 className="ao-title"><span className="ao-title-icon">✅</span> Accept Offer</h2>
          <button className="ao-close" onClick={onClose}>✕</button>
        </div>

        {/* Info Bar */}
        <div className="ao-info-bar">
          <div className="ao-info-item">
            <span className="ao-info-label">Offer:</span>
            <strong className="ao-info-value green">{offer.offer_id}</strong>
          </div>
          <div className="ao-info-item">
            <span className="ao-info-label">Client:</span>
            <strong className="ao-info-value white">{clientName}</strong>
          </div>
          <div className="ao-info-item">
            <span className="ao-info-label">Status:</span>
            <strong className="ao-info-value orange">{(offer.status || 'draft').toUpperCase()}</strong>
          </div>
        </div>

        <div className="ao-body">
          {!accepted ? (
            <>
              {/* Offer Summary */}
              <div className="ao-section-label">📋 Offer Summary</div>
              <div className="ao-summary-box">
                {isComparison && (
                  <div style={{ marginBottom: '12px' }}>
                    <span className="ao-cq-badge">📊 COMPARISON QUOTE</span>
                  </div>
                )}

                {plansData.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div className="ao-plans-label">PLANS{isComparison ? ' (COMPARED)' : ''}</div>
                    {plansData.map((p, i) => {
                      const total = p.principals + p.dependents;
                      const subtotal = (p.regFee + p.fundDeposit) * total;
                      return (
                        <div key={i} className={`ao-plan-row ${isComparison ? 'cq' : ''}`}>
                          <div>
                            <strong className={isComparison ? 'ao-plan-name-cq' : 'ao-plan-name'}>{p.planName}</strong>
                            <div className="ao-plan-detail">{p.principals} principals + {p.dependents} dependents = {total} members</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="ao-plan-amount">{fmtUSD(subtotal)}</div>
                            <div className="ao-plan-fees">Reg: ${p.regFee} | Fund: ${p.fundDeposit}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Totals */}
                <div className="ao-totals-grid">
                  <div className="ao-total-card blue">
                    <div className="ao-total-label">Total Members</div>
                    <div className="ao-total-value blue">{totalMembers}</div>
                  </div>
                  <div className="ao-total-card green">
                    <div className="ao-total-label">Grand Total</div>
                    <div className="ao-total-value green">{fmtUSD(grandTotal)}</div>
                  </div>
                  {offer.includes_dental && (
                    <div className="ao-total-card purple">
                      <div className="ao-total-label">Dental Add-on</div>
                      <div className="ao-total-value purple">{fmtUSD(offer.subtotal_dental || 0)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Documents */}
              <div className="ao-section-label">📄 Generated Documents</div>
              <div className="ao-docs-box">
                {docsLoading ? (
                  <div className="ao-docs-loading">⏳ Loading documents from Drive...</div>
                ) : (
                  <>
                    <div className="ao-docs-counter">
                      <span>📁 Documents in Drive</span>
                      <span className={`ao-docs-count ${generatedCount === filteredDocTypes.length ? 'complete' : generatedCount > 0 ? 'partial' : 'none'}`}>
                        {generatedCount}/{filteredDocTypes.length} generated
                      </span>
                    </div>
                    {filteredDocTypes.map(dt => {
                      const d = docs[dt.key];
                      const hasDoc = d && (d.fileId || d.fileUrl || typeof d === 'string');
                      const url = hasDoc ? (typeof d === 'string' ? d : d.fileUrl || (d.fileId ? `https://drive.google.com/file/d/${d.fileId}/view` : '#')) : '';
                      return (
                        <div key={dt.key} className={`ao-doc-row ${hasDoc ? 'available' : 'missing'}`}>
                          <span className="ao-doc-icon">{dt.icon}</span>
                          <div className="ao-doc-info">
                            <div className="ao-doc-name" style={{ color: dt.color }}>{dt.label}</div>
                            <div className="ao-doc-desc">{dt.desc}</div>
                          </div>
                          {hasDoc ? (
                            <>
                              <span className="ao-doc-badge">✅ v{d.version || 1}</span>
                              <a href={url} target="_blank" rel="noreferrer" className="ao-doc-link">Open ↗</a>
                            </>
                          ) : (
                            <span className="ao-doc-missing">— Not generated</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Acceptance Notes */}
              <div className="ao-section-label">📝 Acceptance Notes (Optional)</div>
              <textarea
                className="ao-notes"
                placeholder="e.g. Client confirmed via email on 04/02/2026, verbal agreement by Mr. Papadopoulos..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />

              {/* Warning */}
              <div className="ao-warning">
                ⚠️ <strong>After accepting:</strong> The offer status will change to <strong style={{ color: '#27ae60' }}>&quot;accepted&quot;</strong>.
                You can then send documents for signature.
                <br /><br />
                💡 If the client has NOT confirmed yet — close this modal and wait for confirmation.
              </div>
            </>
          ) : (
            /* ── Accepted State ── */
            <div className="ao-accepted-box">
              <div className="ao-accepted-icon">✅</div>
              <div className="ao-accepted-title">Offer Accepted Successfully!</div>
              <div className="ao-accepted-sub">Status changed to &quot;accepted&quot;</div>

              <div className="ao-next-steps">
                <div className="ao-next-label">📋 Next Step: Upload Signed Documents</div>
                <div className="ao-next-desc">
                  Ο φάκελος <strong style={{ color: '#1abc9c' }}>&quot;Signed Documents&quot;</strong> είναι έτοιμος.
                  Μόλις παραλάβεις τα υπογεγραμμένα έγγραφα, ανέβασέ τα:
                </div>
              </div>

              <div className="ao-action-cards">
                <div className="ao-action-card upload">
                  <span className="ao-action-icon">📤</span>
                  <span className="ao-action-label">Upload Signed Docs</span>
                  <span className="ao-action-sub">From computer or Drive</span>
                </div>
                <div className="ao-action-card drive" onClick={() => window.open(driveFolderUrl || 'https://drive.google.com', '_blank')}>
                  <span className="ao-action-icon">📁</span>
                  <span className="ao-action-label">Open in Drive</span>
                  <span className="ao-action-sub">View client folder</span>
                </div>
              </div>

              <div className="ao-tip">
                💡 Μπορείς να ανεβάσεις τα υπογεγραμμένα αργότερα — θα βρεις το κουμπί ✅ Signed στον πίνακα offers.
              </div>
            </div>
          )}

          {/* Status */}
          {status && <div className={`ao-status ${status.type}`}>{status.msg}</div>}
        </div>

        {/* Footer */}
        <div className="ao-footer">
          {!accepted ? (
            <>
              <button className="ao-btn cancel" onClick={onClose}>Cancel</button>
              <button className="ao-btn accept" onClick={confirmAccept} disabled={accepting}>
                {accepting ? '⏳ Processing...' : '✅ Accept Offer'}
              </button>
            </>
          ) : (
            <button className="ao-btn done" onClick={onClose}>✅ Done</button>
          )}
        </div>
      </div>

      <style jsx>{`
.ao-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.92); z-index: 99998;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ao-modal {
  background: linear-gradient(135deg, #1a2332, #0f1724);
  border: 1px solid #2d3748; border-radius: 20px;
  width: 100%; max-width: 650px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5); overflow: hidden;
}
.ao-header {
  background: linear-gradient(135deg, #27ae60, #219a52);
  padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
}
.ao-title { color: white; margin: 0; font-size: 1.3rem; font-family: 'Montserrat', sans-serif; display: flex; align-items: center; gap: 10px; }
.ao-title-icon { font-size: 1.5rem; }
.ao-close {
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.2rem;
}
.ao-close:hover { background: rgba(255,255,255,0.3); }
.ao-info-bar {
  padding: 1rem 1.5rem; background: rgba(39,174,96,0.08);
  border-bottom: 1px solid rgba(39,174,96,0.15);
  display: flex; gap: 2rem; flex-wrap: wrap;
}
.ao-info-item { display: flex; gap: 6px; align-items: center; }
.ao-info-label { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
.ao-info-value.green { color: #27ae60; }
.ao-info-value.white { color: white; }
.ao-info-value.orange { color: #f39c12; }
.ao-body { padding: 1.2rem 1.5rem; flex: 1; overflow-y: auto; }
.ao-section-label {
  color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 600;
  margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;
}
.ao-summary-box, .ao-docs-box {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 1rem; margin-bottom: 1.2rem;
}
.ao-cq-badge {
  background: #8b5cf6; color: white; padding: 4px 10px;
  border-radius: 6px; font-size: 0.8rem; font-weight: 600;
}
.ao-plans-label { color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-bottom: 6px; }
.ao-plan-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: rgba(39,174,96,0.06);
  border: 1px solid rgba(39,174,96,0.12); border-radius: 8px; margin-bottom: 6px;
}
.ao-plan-row.cq { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.12); }
.ao-plan-name { color: #27ae60; font-weight: 700; }
.ao-plan-name-cq { color: #8b5cf6; font-weight: 700; }
.ao-plan-detail { color: rgba(255,255,255,0.4); font-size: 0.75rem; }
.ao-plan-amount { color: white; font-weight: 600; }
.ao-plan-fees { color: rgba(255,255,255,0.4); font-size: 0.7rem; }
.ao-totals-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.ao-total-card {
  flex: 1; min-width: 120px; border-radius: 10px; padding: 10px 14px; text-align: center;
}
.ao-total-card.blue { background: rgba(93,173,226,0.08); border: 1px solid rgba(93,173,226,0.2); }
.ao-total-card.green { background: rgba(39,174,96,0.08); border: 1px solid rgba(39,174,96,0.2); }
.ao-total-card.purple { background: rgba(155,89,182,0.08); border: 1px solid rgba(155,89,182,0.2); }
.ao-total-label { color: rgba(255,255,255,0.4); font-size: 0.7rem; text-transform: uppercase; }
.ao-total-value { font-size: 1.4rem; font-weight: 700; font-family: 'Montserrat', sans-serif; }
.ao-total-value.blue { color: #5dade2; }
.ao-total-value.green { color: #27ae60; }
.ao-total-value.purple { color: #9b59b6; }
.ao-docs-loading { text-align: center; padding: 1rem; color: rgba(255,255,255,0.4); font-size: 0.85rem; }
.ao-docs-counter {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ao-docs-counter span:first-child { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
.ao-docs-count { font-weight: 700; font-size: 0.85rem; }
.ao-docs-count.complete { color: #27ae60; }
.ao-docs-count.partial { color: #f39c12; }
.ao-docs-count.none { color: #e74c3c; }
.ao-doc-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px; margin-bottom: 6px;
}
.ao-doc-row.available { background: rgba(39,174,96,0.06); border: 1px solid rgba(39,174,96,0.15); }
.ao-doc-row.missing { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); opacity: 0.5; }
.ao-doc-icon { font-size: 1.3rem; }
.ao-doc-info { flex: 1; }
.ao-doc-name { font-weight: 700; font-size: 0.95rem; }
.ao-doc-desc { color: rgba(255,255,255,0.35); font-size: 0.7rem; }
.ao-doc-badge {
  background: rgba(39,174,96,0.15); color: #27ae60;
  font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;
}
.ao-doc-link {
  background: rgba(93,173,226,0.1); color: #5dade2; text-decoration: none;
  padding: 5px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
  border: 1px solid rgba(93,173,226,0.2); transition: all 0.2s;
}
.ao-doc-link:hover { background: rgba(93,173,226,0.2); }
.ao-doc-missing { color: rgba(255,255,255,0.25); font-size: 0.8rem; }
.ao-notes {
  width: 100%; min-height: 80px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
  color: white; padding: 0.8rem; font-size: 0.9rem; resize: vertical;
  font-family: inherit; box-sizing: border-box; margin-bottom: 1rem;
}
.ao-notes:focus { border-color: rgba(39,174,96,0.5); outline: none; }
.ao-warning {
  background: rgba(243,156,18,0.08); border: 1px solid rgba(243,156,18,0.2);
  border-radius: 10px; padding: 12px 16px; font-size: 0.8rem; color: #f39c12;
  margin-bottom: 1rem;
}
/* ── Accepted State ── */
.ao-accepted-box {
  background: linear-gradient(135deg, rgba(39,174,96,0.1), rgba(39,174,96,0.05));
  border: 2px solid rgba(39,174,96,0.3); border-radius: 16px;
  padding: 1.5rem; text-align: center;
}
.ao-accepted-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.ao-accepted-title { color: #27ae60; font-size: 1.2rem; font-weight: 700; }
.ao-accepted-sub { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin-top: 4px; margin-bottom: 1.2rem; }
.ao-next-steps {
  background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1rem;
  margin-bottom: 1.2rem; text-align: left;
}
.ao-next-label {
  color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
}
.ao-next-desc { color: rgba(255,255,255,0.6); font-size: 0.85rem; line-height: 1.5; }
.ao-action-cards { display: flex; gap: 12px; margin-bottom: 1rem; }
.ao-action-card {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 1.2rem 1rem; border: 2px dashed; border-radius: 14px;
  cursor: pointer; transition: all 0.2s;
}
.ao-action-card.upload { border-color: rgba(26,188,156,0.3); background: rgba(26,188,156,0.08); }
.ao-action-card.upload:hover { background: rgba(26,188,156,0.15); border-color: rgba(26,188,156,0.6); }
.ao-action-card.drive { border-color: rgba(66,133,244,0.3); background: rgba(66,133,244,0.08); }
.ao-action-card.drive:hover { background: rgba(66,133,244,0.15); border-color: rgba(66,133,244,0.6); }
.ao-action-icon { font-size: 2.5rem; }
.ao-action-label { font-weight: 700; font-size: 1rem; }
.ao-action-card.upload .ao-action-label { color: #1abc9c; }
.ao-action-card.drive .ao-action-label { color: #4285f4; }
.ao-action-sub { color: rgba(255,255,255,0.35); font-size: 0.75rem; }
.ao-tip {
  background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2);
  border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; color: #d4a843; text-align: center;
}
.ao-status { padding: 10px; text-align: center; border-radius: 8px; margin-top: 0.75rem; font-size: 0.85rem; }
.ao-status.success { color: #27ae60; }
.ao-status.error { color: #e74c3c; }
.ao-status.loading { color: #f39c12; }
.ao-footer {
  padding: 1.2rem 1.5rem; display: flex; gap: 12px; justify-content: flex-end;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.ao-btn {
  padding: 0.7rem 1.5rem; border-radius: 10px; cursor: pointer;
  font-size: 0.9rem; font-family: 'Montserrat', sans-serif; transition: all 0.2s;
}
.ao-btn.cancel {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6);
}
.ao-btn.cancel:hover { background: rgba(255,255,255,0.1); }
.ao-btn.accept {
  background: linear-gradient(135deg, #27ae60, #219a52); border: none;
  color: white; font-weight: 600; padding: 0.7rem 2rem;
  box-shadow: 0 4px 15px rgba(39,174,96,0.3);
}
.ao-btn.accept:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(39,174,96,0.4); }
.ao-btn.accept:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.ao-btn.done {
  background: linear-gradient(135deg, #27ae60, #219a52); border: none;
  color: white; font-weight: 600; padding: 0.7rem 2rem;
}
@media (max-width: 600px) {
  .ao-modal { max-width: none; margin: 0.5rem; }
  .ao-info-bar { flex-direction: column; gap: 0.5rem; }
  .ao-totals-grid { flex-direction: column; }
  .ao-action-cards { flex-direction: column; }
}
      `}</style>
    </div>
  );
}
