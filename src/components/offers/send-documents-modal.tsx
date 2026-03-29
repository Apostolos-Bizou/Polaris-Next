'use client';
import React, { useRef, useCallback } from 'react';
import { useSendDocuments, SendDocsOffer, PROGRAM_FILE_IDS } from '@/hooks/use-send-documents';

/* ═══════════════════════════════════════════════════════════════════
   Send Documents Modal — Full Screen
   Pixel-perfect match with original admin-dashboard.html
   ═══════════════════════════════════════════════════════════════════ */

export default function SendDocumentsModal() {
  const sd = useSendDocuments();
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ─── execCommand for rich text ─── */
  const formatText = useCallback((cmd: string) => {
    previewRef.current?.focus();
    document.execCommand(cmd, false, undefined);
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      previewRef.current?.focus();
      document.execCommand('createLink', false, url);
    }
  }, []);

  /* ─── Handle local file upload ─── */
  const handleLocalFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) sd.setLocalFiles(Array.from(files));
  }, [sd]);

  /* ─── Status colors for offer cards ─── */
  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    const map: Record<string, string> = {
      draft: '#95a5a6', sent: '#3498db', accepted: '#27ae60', signed: '#27ae60',
      pending_signature: '#9b59b6', rejected: '#e74c3c',
      'follow-up 1': '#f39c12', 'follow-up 2': '#e67e22', 'follow-up 3': '#e74c3c',
      followup1: '#f39c12', followup2: '#e67e22', followup3: '#e74c3c',
    };
    return map[s] || '#95a5a6';
  };

  if (!sd.isOpen) return null;

  return (
    <div className="sd-modal">
      {/* ═══ HEADER ═══ */}
      <div className="sd-header">
        <div className="sd-header-left">
          <h2 className="sd-title">📨 Send Documents</h2>
          <div className="sd-header-info">
            {sd.showClientSearch ? (
              /* Client Search */
              <div className="sd-client-search-row">
                <span className="sd-search-label">🔍 Search Client:</span>
                <div className="sd-search-wrap">
                  <input
                    type="text"
                    className="sd-search-input"
                    placeholder="Type client name..."
                    value={sd.clientSearch}
                    onChange={e => sd.searchClients(e.target.value)}
                    autoComplete="off"
                  />
                  <span className="sd-search-icon">🔍</span>
                  {sd.clientResults.length > 0 && (
                    <div className="sd-dropdown">
                      {sd.clientResults.map((c: any) => (
                        <div
                          key={c.client_id}
                          className="sd-dropdown-item"
                          onClick={() => sd.selectClient(c)}
                        >
                          <div className="sd-dropdown-name">🏢 {c.client_name}</div>
                          {c.contact_name && <div className="sd-dropdown-contact">👤 {c.contact_name}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Selected Client Badge */
              <>
                <div className="sd-client-badge-row">
                  <span className="sd-client-badge">{sd.offer?.clientName}</span>
                  <span className="sd-divider">|</span>
                  <span className="sd-contact-name">{sd.offer?.contactName}</span>
                  <button className="sd-change-btn" onClick={sd.clearClient}>✕ Change Client</button>
                </div>
                {/* Client Offers */}
                {sd.clientOffers.length > 0 && (
                  <div className="sd-offers-row">
                    <div className="sd-offers-header">
                      <span className="sd-offers-label">📋 Recent Offers</span>
                      <span className="sd-offers-count">{sd.clientOffers.length} offer{sd.clientOffers.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="sd-offers-list">
                      {sd.clientOffers.map((o: any) => {
                        const dateStr = o.created_at || o.date_created ? new Date(o.created_at || o.date_created).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'No date';
                        const sc = getStatusColor(o.status);
                        const total = parseFloat(o.grand_total_usd || o.total_amount || 0);
                        const members = parseInt(o.total_members || 0);
                        const isSelected = sd.selectedOfferId === o.offer_id;
                        return (
                          <div
                            key={o.offer_id}
                            className={`sd-offer-card${isSelected ? ' selected' : ''}`}
                            onClick={() => sd.selectOffer(o.offer_id, o)}
                          >
                            <div className="sd-offer-card-top">
                              <span className="sd-offer-id">{o.offer_id}</span>
                              <span className="sd-offer-status" style={{ color: sc, background: sc + '33' }}>{o.status || 'draft'}</span>
                            </div>
                            <div className="sd-offer-card-bot">
                              <span className="sd-offer-date">{dateStr}</span>
                              <span className="sd-offer-total">${total.toLocaleString()}</span>
                            </div>
                            <div className="sd-offer-members">{members} members</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <button className="sd-close-btn" onClick={sd.closeModal}>✕</button>
      </div>

      {/* ═══ BODY — Two Columns ═══ */}
      <div className="sd-body">
        {/* ─── LEFT COLUMN ─── */}
        <div className="sd-left">
          {/* Contract Documents */}
          <div className="sd-section">
            <div className="sd-section-hdr"><span className="sd-section-icon">📄</span><h3>Contract Documents</h3></div>
            <div className="sd-section-body">
              <div className="sd-doc-grid">
                {sd.docs.map(doc => (
                  <label
                    key={doc.key}
                    className={`sd-doc-item${sd.checkedDocs[doc.value] ? ' checked' : ''}${doc.available ? ' available' : ''}`}
                    onClick={() => sd.toggleDoc(doc.value)}
                  >
                    <input type="checkbox" checked={!!sd.checkedDocs[doc.value]} readOnly />
                    <div className="sd-doc-label">
                      <span className="sd-doc-name">{doc.icon} {doc.value}</span>
                      <span className="sd-doc-desc">{doc.desc}</span>
                    </div>
                    {doc.available && <span className="sd-doc-badge">✓ v{doc.version || 1}</span>}
                  </label>
                ))}
                {sd.showCQ && (
                  <label
                    className={`sd-doc-item cq${sd.cqChecked ? ' checked' : ''}`}
                    onClick={() => sd.setCqChecked(!sd.cqChecked)}
                  >
                    <input type="checkbox" checked={sd.cqChecked} readOnly />
                    <div className="sd-doc-label">
                      <span className="sd-doc-name">📊 Comparison Quote</span>
                      <span className="sd-doc-desc">Multi-plan comparison document</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Program Brochures */}
          <div className="sd-section">
            <div className="sd-section-hdr">
              <span className="sd-section-icon">📋</span>
              <h3>Program Brochures</h3>
              <span className="sd-hint-star">★ Highlighted = Offer programs</span>
            </div>
            <div className="sd-section-body">
              <div className="sd-prog-grid">
                {sd.programs.map((p, i) => (
                  <label
                    key={p.name}
                    className={`sd-prog-item${p.checked ? ' checked' : ''}${p.highlighted ? ' highlighted' : ''}`}
                    onClick={() => sd.toggleProgram(i)}
                  >
                    <input type="checkbox" checked={p.checked} readOnly />
                    <span className="sd-prog-icon">{p.icon}</span>
                    <span className="sd-prog-name">{p.name}</span>
                    <span className="sd-prog-limit">{p.limit}</span>
                  </label>
                ))}
                {/* Drive / Local split */}
                <div className="sd-prog-item sd-split-item">
                  <div className="sd-split-btn drive" onClick={() => window.open('https://drive.google.com/drive/folders/15mkQBf1Cpf1myga-0TZetbrsRZ65OiED', '_blank')}>
                    <span className="sd-split-icon">☁️</span>
                    <span className="sd-split-label">Drive</span>
                  </div>
                  <div className="sd-split-btn local" onClick={() => fileInputRef.current?.click()}>
                    <span className="sd-split-icon">💻</span>
                    <span className="sd-split-label">Local</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={handleLocalFiles} />
              </div>
            </div>
          </div>

          {/* Document Format & Status */}
          <div className="sd-section">
            <div className="sd-section-hdr"><span className="sd-section-icon">📋</span><h3>Document Format & Status</h3></div>
            <div className="sd-section-body">
              <div className="sd-format-grid">
                <div>
                  <label className="sd-field-label">📄 Contract Documents Format</label>
                  <select className="sd-select" value={sd.docFormat} onChange={e => sd.setDocFormat(e.target.value as 'word' | 'pdf')}>
                    <option value="word">📝 Word (.docx) - For Review</option>
                    <option value="pdf">📑 PDF - For Signature</option>
                  </select>
                  <div className="sd-format-hint">⚠️ Proposals & Quotes → Always PDF (locked)</div>
                </div>
                <div>
                  <label className="sd-field-label">📊 Update Status After Send</label>
                  <select className="sd-select" value={sd.newStatus} onChange={e => sd.setNewStatus(e.target.value)}>
                    <option value="">-- No Change --</option>
                    <option value="sent">📤 Sent</option>
                    <option value="pending_signature">✍️ Pending Signature</option>
                    <option value="accepted">✅ Accepted</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Options */}
          <div className="sd-section">
            <div className="sd-section-hdr"><span className="sd-section-icon">✍️</span><h3>Signature Options</h3></div>
            <div className="sd-section-body">
              <div className="sd-sig-row">
                <label className={`sd-sig-toggle${sd.signDocs ? ' active' : ''}`}>
                  <input type="checkbox" checked={sd.signDocs} onChange={e => sd.setSignDocs(e.target.checked)} />
                  <span>Sign Documents</span>
                </label>
                <select className="sd-sig-select" disabled={!sd.signDocs} value={sd.signatory} onChange={e => sd.setSignatory(e.target.value)}>
                  <option value="">-- Select Signatory --</option>
                  <option value="apostolos_kagelaris">Apostolos Kagelaris (CEO)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="sd-right">
          {/* Email Template */}
          <div className="sd-section">
            <div className="sd-section-hdr">
              <span className="sd-section-icon">📝</span>
              <h3>Email Template</h3>
              <button className="sd-manage-btn" onClick={() => window.open('https://drive.google.com/drive/folders/', '_blank')}>📂 Manage Templates</button>
            </div>
            <div className="sd-section-body">
              <select className="sd-select" value={sd.selectedTemplate} onChange={e => sd.selectTemplate(e.target.value)}>
                <option value="">-- Select Email Template --</option>
                <optgroup label="📄 Document Delivery">
                  {sd.templates.filter(t => t.category === 'Document Delivery').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="📋 Follow-up">
                  {sd.templates.filter(t => t.category === 'Follow-up').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                {sd.templates.filter(t => !['Document Delivery', 'Follow-up'].includes(t.category)).length > 0 && (
                  <optgroup label="📁 Other">
                    {sd.templates.filter(t => !['Document Delivery', 'Follow-up'].includes(t.category)).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Recipients */}
          <div className="sd-section">
            <div className="sd-section-hdr"><span className="sd-section-icon">👥</span><h3>Recipients</h3></div>
            <div className="sd-section-body">
              <div className="sd-recipients-box">
                {sd.recipients.length === 0 ? (
                  <p className="sd-placeholder">🔍 Search and select a client first</p>
                ) : sd.recipients.map((r, i) => (
                  <div key={i} className="sd-recip-row">
                    <input type="checkbox" checked={r.checked} onChange={() => sd.toggleRecipient(i)} />
                    <div className="sd-recip-info">
                      <div className="sd-recip-name">{r.name}</div>
                      <div className="sd-recip-email">{r.email}</div>
                    </div>
                    <span className="sd-recip-role">{r.role}</span>
                  </div>
                ))}
              </div>
              <div className="sd-role-btns">
                {['all', 'Primary', 'Finance', 'Operations', 'Marketing', 'Develop', 'Legal', 'clear'].map(role => (
                  <button key={role} className="sd-role-btn" onClick={() => sd.selectRecipientsByRole(role)}>
                    {role === 'all' ? '☑️ All' : role === 'clear' ? '✖️ Clear'
                      : role === 'Primary' ? '👤 Primary' : role === 'Finance' ? '💰 Finance'
                      : role === 'Operations' ? '🔧 Operations' : role === 'Marketing' ? '📣 Marketing'
                      : role === 'Develop' ? '💻 Develop' : '⚖️ Legal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="sd-section sd-email-section">
            <div className="sd-section-hdr">
              <span className="sd-section-icon">✏️</span>
              <h3>Email Body</h3>
              <span className="sd-editable-badge">✎ Editable</span>
            </div>
            <div className="sd-section-body">
              {/* Toolbar */}
              <div className="sd-toolbar">
                <button onClick={() => formatText('bold')} title="Bold"><strong>B</strong></button>
                <button onClick={() => formatText('italic')} title="Italic"><em>I</em></button>
                <button onClick={() => formatText('underline')} title="Underline" style={{ textDecoration: 'underline' }}>U</button>
                <span className="sd-toolbar-sep" />
                <button onClick={() => formatText('insertUnorderedList')} title="Bullet List">• List</button>
                <button onClick={() => formatText('insertOrderedList')} title="Numbered List">1. List</button>
                <span className="sd-toolbar-sep" />
                <button onClick={insertLink} title="Insert Link">🔗 Link</button>
                <span className="sd-toolbar-sep" />
                <button className="sd-reset-btn" onClick={sd.resetTemplate} title="Reset to Template">↺ Reset</button>
              </div>
              {/* Preview */}
              <div
                ref={previewRef}
                className="sd-preview"
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: sd.emailBody || '<div class="sd-preview-placeholder">Select a template to see preview, then edit as needed...</div>' }}
                onBlur={e => sd.setEmailBody(e.currentTarget.innerHTML)}
              />
              <div className="sd-tip">💡 Tip: Click inside to edit. Use toolbar for formatting. Changes are saved automatically.</div>
            </div>
          </div>

          {/* Status */}
          {sd.status && (
            <div className={`sd-status ${sd.status.type}`}>{sd.status.msg}</div>
          )}
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="sd-footer">
        <span className="sd-attach-count">📎 {sd.attachmentCount} attachment{sd.attachmentCount !== 1 ? 's' : ''}</span>
        <div className="sd-footer-docs">
          {Object.entries(sd.checkedDocs).filter(([, v]) => v).map(([k]) => (
            <span key={k} className="sd-footer-doc-tag">{k}</span>
          ))}
          {sd.cqChecked && <span className="sd-footer-doc-tag">CQ</span>}
          {sd.programs.filter(p => p.checked).map(p => (
            <span key={p.name} className="sd-footer-doc-tag prog">{p.name}</span>
          ))}
          {sd.attachmentCount === 0 && <span className="sd-no-docs">No documents selected</span>}
        </div>
        <div className="sd-footer-actions">
          <button className="sd-btn preview" onClick={() => { /* preview logic */ }}>👁️ Preview Email</button>
          <button className="sd-btn draft" onClick={sd.saveDraft} disabled={sd.loading}>💾 Save Draft</button>
          <button className="sd-btn send" onClick={sd.submitSend} disabled={!sd.canSend || sd.loading}>📧 Send Documents</button>
        </div>
      </div>

      <style jsx>{`
/* ═══════════════════════════════════════════════════════════════
   SEND DOCUMENTS MODAL — Polaris Dark Navy Theme
   ═══════════════════════════════════════════════════════════════ */
.sd-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
  z-index: 99999; backdrop-filter: blur(8px);
}

/* ─── Header ─── */
.sd-header {
  background: linear-gradient(135deg, #1e3a5f, #2d5a87);
  padding: 20px 30px; display: flex; justify-content: space-between;
  align-items: flex-start; flex-shrink: 0;
  border-bottom: 3px solid #d4af37;
}
.sd-header-left { flex: 1; }
.sd-title {
  color: white; margin: 0; font-size: 1.6rem;
  font-family: 'Montserrat', sans-serif;
}
.sd-header-info { margin-top: 10px; }
.sd-client-search-row { display: flex; align-items: center; gap: 15px; }
.sd-search-label { color: #d4af37; font-weight: 600; }
.sd-search-wrap { position: relative; }
.sd-search-input {
  padding: 10px 40px 10px 15px; background: rgba(255,255,255,0.1);
  border: 2px solid #d4af37; border-radius: 25px; color: white;
  font-size: 14px; width: 300px; outline: none;
}
.sd-search-input::placeholder { color: rgba(255,255,255,0.5); }
.sd-search-icon { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #d4af37; }
.sd-dropdown {
  position: absolute; z-index: 100; width: 100%; max-height: 250px;
  overflow-y: auto; background: #1a2332; border: 2px solid #d4af37;
  border-radius: 12px; margin-top: 5px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.sd-dropdown-item {
  padding: 12px 18px; cursor: pointer; border-bottom: 1px solid #2d3748;
  transition: background 0.2s;
}
.sd-dropdown-item:hover { background: rgba(212,175,67,0.2); }
.sd-dropdown-name { color: #d4af37; font-weight: 600; font-size: 0.95rem; }
.sd-dropdown-contact { color: #7aa0c0; font-size: 0.8rem; margin-top: 2px; }

.sd-client-badge-row { display: flex; align-items: center; gap: 15px; }
.sd-client-badge {
  background: rgba(212,175,55,0.2); color: #d4af37;
  padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;
}
.sd-divider { color: #b0b0b0; }
.sd-contact-name { color: #b8d4e8; }
.sd-change-btn {
  background: rgba(231,76,60,0.3); border: none; color: #ff6b6b;
  padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 12px; margin-left: 10px;
}
.sd-change-btn:hover { background: rgba(231,76,60,0.5); }

/* Client offers row */
.sd-offers-row {
  margin-top: 10px; padding: 12px; background: rgba(30,58,95,0.5);
  border-radius: 12px; border: 1px solid rgba(212,168,67,0.3);
}
.sd-offers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sd-offers-label { color: #d4af37; font-weight: 600; font-size: 0.9rem; }
.sd-offers-count { color: #7aa0c0; font-size: 0.8rem; }
.sd-offers-list {
  display: flex; flex-wrap: wrap; gap: 8px; max-height: 120px; overflow-y: auto;
  scrollbar-width: thin; scrollbar-color: #d4af37 #1a2332;
}
.sd-offer-card {
  background: linear-gradient(135deg, #1a2332, #243447);
  border: 2px solid transparent; border-radius: 10px;
  padding: 10px 14px; cursor: pointer; min-width: 180px;
  transition: all 0.2s;
}
.sd-offer-card:hover { border-color: #d4af37; transform: translateY(-2px); }
.sd-offer-card.selected { border-color: #d4af37; background: linear-gradient(135deg, #2a3a4a, #344a5a); }
.sd-offer-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.sd-offer-id { color: #d4af37; font-weight: 600; font-size: 0.85rem; }
.sd-offer-status { padding: 2px 8px; border-radius: 8px; font-size: 0.7rem; text-transform: uppercase; }
.sd-offer-card-bot { display: flex; justify-content: space-between; align-items: center; }
.sd-offer-date { color: #7aa0c0; font-size: 0.75rem; }
.sd-offer-total { color: #fff; font-size: 0.8rem; }
.sd-offer-members { color: #95a5a6; font-size: 0.75rem; margin-top: 4px; }

.sd-close-btn {
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 50px; height: 50px; border-radius: 50%; cursor: pointer;
  font-size: 1.8rem; transition: all 0.3s; flex-shrink: 0;
}
.sd-close-btn:hover { background: rgba(231,76,60,0.8); transform: scale(1.1); }

/* ─── Body ─── */
.sd-body {
  flex: 1; overflow-y: auto; padding: 25px 30px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 30px;
  background: #1a2332;
}
.sd-left, .sd-right { display: flex; flex-direction: column; gap: 20px; }

/* ─── Sections ─── */
.sd-section { background: #2d3748; border-radius: 16px; border: 1px solid #4a5568; overflow: hidden; }
.sd-section-hdr {
  background: linear-gradient(135deg, #1e3a5f, #2a4a6f);
  padding: 16px 20px; display: flex; align-items: center; gap: 12px;
}
.sd-section-hdr h3 { color: white; margin: 0; font-size: 1.1rem; font-family: 'Montserrat', sans-serif; }
.sd-section-icon { font-size: 1.4rem; }
.sd-section-body { padding: 20px; }

/* Doc grid */
.sd-doc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.sd-doc-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; background: #1a2332;
  border: 2px solid #4a5568; border-radius: 12px;
  cursor: pointer; transition: all 0.3s; min-height: 60px;
  position: relative;
}
.sd-doc-item:hover { border-color: #d4af37; background: rgba(212,175,55,0.05); }
.sd-doc-item.checked { border-color: #4CAF50; background: rgba(76,175,80,0.15); }
.sd-doc-item.available { border-color: #27ae60; }
.sd-doc-item.cq { border-color: #8b5cf6; }
.sd-doc-item.cq.checked { border-color: #8b5cf6; background: rgba(139,92,246,0.15); }
.sd-doc-item input[type="checkbox"] { width: 26px; height: 26px; cursor: pointer; accent-color: #4CAF50; }
.sd-doc-label { flex: 1; display: flex; flex-direction: column; }
.sd-doc-name { color: #ffffff; font-weight: 600; font-size: 1rem; }
.sd-doc-desc { color: #7aa0c0; font-size: 0.8rem; margin-top: 2px; }
.sd-doc-badge {
  position: absolute; top: 5px; right: 5px;
  background: #27ae60; color: white; font-size: 0.65rem;
  padding: 2px 6px; border-radius: 8px;
}

/* Program grid */
.sd-prog-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.sd-prog-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 10px; background: #1a2332;
  border: 2px solid #4a5568; border-radius: 12px;
  cursor: pointer; transition: all 0.3s; text-align: center;
}
.sd-prog-item:hover { border-color: #d4af37; transform: translateY(-2px); }
.sd-prog-item.checked { border-color: #4CAF50; background: rgba(76,175,80,0.15); }
.sd-prog-item.highlighted { border-color: #d4af37; background: rgba(212,175,55,0.2); box-shadow: 0 0 15px rgba(212,175,55,0.3); }
.sd-prog-item input[type="checkbox"] { width: 22px; height: 22px; margin-bottom: 8px; accent-color: #4CAF50; }
.sd-prog-icon { font-size: 1.8rem; margin-bottom: 6px; }
.sd-prog-name { color: #ffffff; font-weight: 600; font-size: 0.9rem; }
.sd-prog-limit { color: #7aa0c0; font-size: 0.7rem; margin-top: 4px; }
.sd-hint-star { margin-left: auto; font-size: 0.8rem; color: #d4af37; }

/* Split item (Drive / Local) */
.sd-split-item {
  padding: 0 !important; overflow: hidden; display: flex !important;
  flex-direction: row !important; border: 2px dashed #d4af37 !important;
  background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05)) !important;
}
.sd-split-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 10px 5px; cursor: pointer;
  transition: all 0.2s;
}
.sd-split-btn.drive { border-right: 1px solid rgba(212,175,55,0.3); }
.sd-split-btn.drive:hover { background: rgba(66,133,244,0.2); }
.sd-split-btn.local:hover { background: rgba(76,175,80,0.2); }
.sd-split-icon { font-size: 1.6rem; }
.sd-split-label { color: #d4af37; font-size: 0.7rem; font-weight: 600; }

/* Format grid */
.sd-format-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.sd-field-label { display: block; color: #7aa0c0; font-size: 0.85rem; margin-bottom: 6px; }
.sd-select {
  width: 100%; padding: 12px 14px; background: #1a2942;
  border: 1px solid #3182ce; border-radius: 8px; color: white;
  font-size: 0.9rem; cursor: pointer; outline: none;
}
.sd-select:focus { border-color: #d4af37; }
.sd-format-hint { margin-top: 6px; font-size: 0.75rem; color: #d4a843; }

/* Signature */
.sd-sig-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.sd-sig-toggle {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; background: #1a2332;
  border: 2px solid #4a5568; border-radius: 12px;
  cursor: pointer; transition: all 0.3s;
}
.sd-sig-toggle.active { border-color: #9c27b0; background: rgba(156,39,176,0.15); }
.sd-sig-toggle input[type="checkbox"] { width: 24px; height: 24px; accent-color: #9c27b0; }
.sd-sig-toggle span { color: white; font-weight: 600; }
.sd-sig-select {
  flex: 1; padding: 14px 18px; background: #1a2332;
  border: 2px solid #4a5568; border-radius: 12px;
  color: white; font-size: 1rem; cursor: pointer; min-width: 250px;
}
.sd-sig-select:disabled { opacity: 0.5; }
.sd-sig-select:focus { outline: none; border-color: #9c27b0; }

/* Manage Templates */
.sd-manage-btn {
  margin-left: auto; padding: 6px 12px;
  background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1));
  border: 1px solid #d4af37; border-radius: 6px;
  color: #d4af37; font-size: 0.75rem; cursor: pointer;
}
.sd-manage-btn:hover { background: rgba(212,175,55,0.3); }

/* Recipients */
.sd-recipients-box {
  background: #1a2332; border: 2px solid #4a5568;
  border-radius: 12px; padding: 16px; max-height: 200px;
  overflow-y: auto;
}
.sd-placeholder { color: #7aa0c0; text-align: center; padding: 20px; margin: 0; }
.sd-recip-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; border-radius: 8px; transition: background 0.2s;
}
.sd-recip-row:hover { background: rgba(255,255,255,0.05); }
.sd-recip-row input[type="checkbox"] { width: 20px; height: 20px; accent-color: #1976D2; }
.sd-recip-info { flex: 1; }
.sd-recip-name { color: white; font-weight: 500; }
.sd-recip-email { color: #7aa0c0; font-size: 0.85rem; }
.sd-recip-role {
  font-size: 0.7rem; padding: 4px 10px; border-radius: 20px;
  background: #4a5568; color: #b8d4e8;
}
.sd-role-btns { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.sd-role-btn {
  padding: 8px 16px; background: #4a5568; border: none;
  border-radius: 20px; color: white; cursor: pointer; font-size: 0.85rem;
  transition: all 0.2s;
}
.sd-role-btn:hover { background: #5a6a7a; transform: translateY(-1px); }

/* Email Body */
.sd-email-section { flex: 1; }
.sd-editable-badge {
  margin-left: auto; font-size: 0.75rem; color: #4CAF50;
  background: rgba(76,175,80,0.2); padding: 4px 12px; border-radius: 12px;
}
.sd-toolbar {
  display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
  padding: 10px; background: #1a2332; border-radius: 10px;
}
.sd-toolbar button {
  padding: 8px 12px; background: #4a5568; border: none;
  border-radius: 6px; color: white; cursor: pointer; font-size: 0.9rem;
  transition: all 0.2s;
}
.sd-toolbar button:hover { background: #5a6a7a; }
.sd-toolbar-sep { width: 1px; background: #4a5568; margin: 0 5px; }
.sd-reset-btn { background: #e74c3c !important; }
.sd-reset-btn:hover { background: #c0392b !important; }

.sd-preview {
  background: #ffffff; border-radius: 12px;
  padding: 20px; color: #333; min-height: 200px; max-height: 250px;
  overflow-y: auto; outline: none; border: 2px solid transparent;
  transition: border-color 0.3s; cursor: text;
  font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;
}
.sd-preview:focus { border-color: #1976D2; }
.sd-preview-placeholder { text-align: center; color: #999; padding: 30px; }
.sd-tip { margin-top: 8px; font-size: 0.75rem; color: #7aa0c0; }

/* Status */
.sd-status {
  padding: 12px 20px; border-radius: 10px; text-align: center; margin-top: 15px;
}
.sd-status.success { background: rgba(76,175,80,0.2); color: #4CAF50; }
.sd-status.error { background: rgba(231,76,60,0.2); color: #e74c3c; }
.sd-status.loading { background: rgba(25,118,210,0.2); color: #1976D2; }

/* ─── Footer ─── */
.sd-footer {
  background: #2d3748; padding: 12px 20px;
  display: flex; justify-content: space-between;
  align-items: center; border-top: 1px solid #4a5568;
  flex-shrink: 0; gap: 15px;
}
.sd-attach-count {
  background: rgba(76,175,80,0.2); color: #4CAF50;
  padding: 6px 14px; border-radius: 20px; font-weight: 600;
  font-size: 0.85rem; white-space: nowrap;
}
.sd-footer-docs {
  display: flex; flex-wrap: wrap; gap: 4px; flex: 1;
  max-height: 30px; overflow: hidden;
}
.sd-footer-doc-tag {
  background: rgba(30,58,95,0.6); color: #b8d4e8;
  padding: 3px 10px; border-radius: 12px; font-size: 0.75rem;
}
.sd-footer-doc-tag.prog { background: rgba(212,175,55,0.2); color: #d4af37; }
.sd-no-docs { color: #7aa0c0; font-size: 0.8rem; }
.sd-footer-actions { display: flex; gap: 8px; }

.sd-btn {
  padding: 8px 16px; border: none; border-radius: 25px;
  font-family: 'Montserrat', sans-serif; font-weight: 600;
  cursor: pointer; transition: all 0.3s; font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
}
.sd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sd-btn.preview { background: #4a5568; color: white; }
.sd-btn.preview:hover:not(:disabled) { background: #5a6578; transform: translateY(-2px); }
.sd-btn.draft { background: linear-gradient(135deg, #f39c12, #e67e22); color: white; }
.sd-btn.draft:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(243,156,18,0.4); }
.sd-btn.send { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 8px 20px; font-size: 0.9rem; }
.sd-btn.send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(39,174,96,0.4); }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
  .sd-body { grid-template-columns: 1fr; padding: 15px; }
  .sd-prog-grid { grid-template-columns: repeat(3, 1fr); }
  .sd-header { padding: 15px 20px; }
  .sd-title { font-size: 1.3rem; }
  .sd-footer { flex-direction: column; gap: 15px; }
  .sd-footer-actions { width: 100%; flex-direction: column; }
  .sd-btn { width: 100%; justify-content: center; }
}
@media (max-width: 600px) {
  .sd-doc-grid { grid-template-columns: 1fr; }
  .sd-prog-grid { grid-template-columns: repeat(2, 1fr); }
  .sd-format-grid { grid-template-columns: 1fr; }
  .sd-sig-row { flex-direction: column; }
  .sd-sig-select { width: 100%; }
  .sd-search-input { width: 200px; }
}
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Export hook for external access
   ═══════════════════════════════════════════════════════════════════ */
export { useSendDocuments };
export type { SendDocsOffer };
