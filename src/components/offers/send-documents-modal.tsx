'use client';
import React, { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { useSendDocuments as UseSendDocsHookType } from '@/hooks/use-send-documents';

type SD = ReturnType<typeof UseSendDocsHookType>;

export default function SendDocumentsModal({ sd }: { sd: SD }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) sd.setLocalFiles(Array.from(e.target.files));
  }, [sd]);

  const sc = (s: string) => {
    const m: Record<string,string> = { draft:'#95a5a6', sent:'#3498db', accepted:'#27ae60', signed:'#27ae60', pending_signature:'#9b59b6', rejected:'#e74c3c', followup1:'#f39c12', followup2:'#e67e22', followup3:'#e74c3c' };
    return m[(s||'').toLowerCase()] || '#95a5a6';
  };

  // Open in Email Center — save selected docs to localStorage
  const openInEmailCenter = () => {
    const selectedDocs = Object.entries(sd.checkedDocs).filter(([,v]) => v).map(([k]) => k);
    if (sd.cqChecked) selectedDocs.push('COMPARISON_QUOTE');
    const selectedProgs = sd.programs.filter(p => p.checked).map(p => p.name);

    const payload = {
      offerId: sd.offer?.offerId || '',
      clientId: sd.offer?.clientId || '',
      clientName: sd.offer?.clientName || '',
      contactName: sd.offer?.contactName || '',
      contactEmail: sd.offer?.contactEmail || '',
      documents: selectedDocs,
      programs: selectedProgs,
      documentFormat: sd.docFormat,
      signDocs: sd.signDocs,
      signatory: sd.signatory,
    };

    localStorage.setItem('polaris_send_docs', JSON.stringify(payload));
    sd.closeModal();
    router.push('/email?sendDocs=true');
  };

  if (!sd.isOpen) return null;

  return (<div className="sd-modal">
    {/* HEADER */}
    <div className="sd-header">
      <div className="sd-header-left">
        <h2 className="sd-title">📨 Send Documents</h2>
        <div className="sd-header-info">
          {sd.showClientSearch ? (
            <div className="sd-client-search-row">
              <span className="sd-search-label">🔍 Search Client:</span>
              <div className="sd-search-wrap">
                <input className="sd-search-input" placeholder="Type client name..." value={sd.clientSearch} onChange={e=>sd.searchClients(e.target.value)} autoComplete="off"/>
                <span className="sd-search-icon">🔍</span>
                {sd.clientResults.length>0&&<div className="sd-dropdown">{sd.clientResults.map((c:any)=>(<div key={c.client_id} className="sd-dropdown-item" onClick={()=>sd.selectClient(c)}><div className="sd-dropdown-name">🏢 {c.client_name}</div>{c.contact_name&&<div className="sd-dropdown-contact">👤 {c.contact_name}</div>}</div>))}</div>}
              </div>
            </div>
          ) : (<>
            <div className="sd-client-badge-row">
              <span className="sd-client-badge">{sd.offer?.clientName}</span>
              <span className="sd-divider">|</span>
              <span className="sd-contact-name">{sd.offer?.contactName}</span>
              <button className="sd-change-btn" onClick={sd.clearClient}>✕ Change Client</button>
            </div>
            {sd.clientOffers.length>0&&(
              <div className="sd-offers-row">
                <div className="sd-offers-header"><span className="sd-offers-label">📋 Recent Offers</span><span className="sd-offers-count">{sd.clientOffers.length} offers</span></div>
                <div className="sd-offers-list">{sd.clientOffers.map((o:any)=>{const d=o.created_at||o.date_created?new Date(o.created_at||o.date_created).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}):'';const c2=sc(o.status);const t=parseFloat(o.grand_total_usd||0);return(<div key={o.offer_id} className={`sd-offer-card${sd.selectedOfferId===o.offer_id?' selected':''}`} onClick={()=>sd.selectOffer(o.offer_id,o)}><div className="sd-offer-card-top"><span className="sd-offer-id">{o.offer_id}</span><span className="sd-offer-status" style={{color:c2,background:c2+'33'}}>{o.status||'draft'}</span></div><div className="sd-offer-card-bot"><span className="sd-offer-date">{d}</span><span className="sd-offer-total">${t.toLocaleString()}</span></div><div className="sd-offer-members">{parseInt(o.total_members||0)} members</div></div>)})}</div>
              </div>
            )}
          </>)}
        </div>
      </div>
      <button className="sd-close-btn" onClick={sd.closeModal}>✕</button>
    </div>

    {/* BODY — Single Column (Left Side Only) */}
    <div className="sd-body">
      {/* Contract Documents */}
      <div className="sd-section"><div className="sd-section-hdr"><span className="sd-section-icon">📄</span><h3>Contract Documents</h3></div><div className="sd-section-body"><div className="sd-doc-grid">
        {sd.docs.map(doc=>(<label key={doc.key} className={`sd-doc-item${sd.checkedDocs[doc.value]?' checked':''}${doc.available?' available':''}`} onClick={()=>sd.toggleDoc(doc.value)}><input type="checkbox" checked={!!sd.checkedDocs[doc.value]} readOnly/><div className="sd-doc-label"><span className="sd-doc-name">{doc.icon} {doc.value}</span><span className="sd-doc-desc">{doc.desc}</span></div>{doc.available&&<span className="sd-doc-badge">✓ v{doc.version||1}</span>}</label>))}
        {sd.showCQ&&<label className={`sd-doc-item cq${sd.cqChecked?' checked':''}`} onClick={()=>sd.setCqChecked(!sd.cqChecked)}><input type="checkbox" checked={sd.cqChecked} readOnly/><div className="sd-doc-label"><span className="sd-doc-name">📊 Comparison Quote</span><span className="sd-doc-desc">Multi-plan comparison document</span></div></label>}
      </div></div></div>

      {/* Program Brochures */}
      <div className="sd-section"><div className="sd-section-hdr"><span className="sd-section-icon">📋</span><h3>Program Brochures</h3><span className="sd-hint-star">★ Highlighted = Offer programs</span></div><div className="sd-section-body"><div className="sd-prog-grid">
        {sd.programs.map((p,i)=>(<label key={p.name} className={`sd-prog-item${p.checked?' checked':''}${p.highlighted?' highlighted':''}`} onClick={()=>sd.toggleProgram(i)}><input type="checkbox" checked={p.checked} readOnly/><span className="sd-prog-icon">{p.icon}</span><span className="sd-prog-name">{p.name}</span><span className="sd-prog-limit">{p.limit}</span></label>))}
        <div className="sd-prog-item sd-split-item"><div className="sd-split-btn drive" onClick={()=>window.open('https://drive.google.com/drive/folders/15mkQBf1Cpf1myga-0TZetbrsRZ65OiED','_blank')}><span className="sd-split-icon">☁️</span><span className="sd-split-label">Drive</span></div><div className="sd-split-btn local" onClick={()=>fileInputRef.current?.click()}><span className="sd-split-icon">💻</span><span className="sd-split-label">Local</span></div></div>
        <input type="file" ref={fileInputRef} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" style={{display:'none'}} onChange={handleFiles}/>
      </div></div></div>

      {/* Document Format & Status */}
      <div className="sd-two-col">
        <div className="sd-section"><div className="sd-section-hdr"><span className="sd-section-icon">📋</span><h3>Document Format & Status</h3></div><div className="sd-section-body"><div className="sd-format-grid">
          <div><label className="sd-field-label">📄 Contract Documents Format</label><select className="sd-select" value={sd.docFormat} onChange={e=>sd.setDocFormat(e.target.value as any)}><option value="word">📝 Word (.docx) - For Review</option><option value="pdf">📑 PDF - For Signature</option></select><div className="sd-format-hint">⚠️ Proposals & Quotes → Always PDF (locked)</div></div>
          <div><label className="sd-field-label">📊 Update Status After Send</label><select className="sd-select" value={sd.newStatus} onChange={e=>sd.setNewStatus(e.target.value)}><option value="">-- No Change --</option><option value="sent">📤 Sent</option><option value="pending_signature">✍️ Pending Signature</option><option value="accepted">✅ Accepted</option><option value="rejected">❌ Rejected</option></select></div>
        </div></div></div>

        {/* Signature */}
        <div className="sd-section"><div className="sd-section-hdr"><span className="sd-section-icon">✍️</span><h3>Signature Options</h3></div><div className="sd-section-body"><div className="sd-sig-row">
          <label className={`sd-sig-toggle${sd.signDocs?' active':''}`}><input type="checkbox" checked={sd.signDocs} onChange={e=>sd.setSignDocs(e.target.checked)}/><span>Sign Documents</span></label>
          <select className="sd-sig-select" disabled={!sd.signDocs} value={sd.signatory} onChange={e=>sd.setSignatory(e.target.value)}><option value="">-- Select Signatory --</option><option value="apostolos_kagelaris">Apostolos Kagelaris (CEO)</option></select>
        </div></div></div>
      </div>
    </div>

    {/* FOOTER */}
    <div className="sd-footer">
      <span className="sd-attach-count">📎 {sd.attachmentCount} attachment{sd.attachmentCount!==1?'s':''}</span>
      <div className="sd-footer-docs">
        {Object.entries(sd.checkedDocs).filter(([,v])=>v).map(([k])=>(<span key={k} className="sd-footer-doc-tag">{k}</span>))}
        {sd.cqChecked&&<span className="sd-footer-doc-tag">CQ</span>}
        {sd.programs.filter(p=>p.checked).map(p=>(<span key={p.name} className="sd-footer-doc-tag prog">{p.name}</span>))}
        {sd.attachmentCount===0&&<span className="sd-no-docs">No documents selected</span>}
      </div>
      <div className="sd-footer-actions">
        <button className="sd-btn cancel" onClick={sd.closeModal}>Cancel</button>
        <button className="sd-btn preview" onClick={() => alert('Preview coming soon')}>👁️ Preview Email</button>
        <button className="sd-btn draft" onClick={sd.saveDraft} disabled={sd.attachmentCount===0}>💾 Save Draft</button>
        <button className="sd-btn email" onClick={openInEmailCenter} disabled={sd.attachmentCount===0}>
          📧 Open in Email Center
        </button>
      </div>
    </div>

    <style jsx>{`
.sd-modal{position:fixed;top:0;left:260px;width:calc(100% - 260px);height:100%;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;z-index:99999;backdrop-filter:blur(8px)}
.sd-header{background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:20px 30px;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0;border-bottom:3px solid #d4af37}
.sd-header-left{flex:1}.sd-title{color:white;margin:0;font-size:1.6rem;font-family:'Montserrat',sans-serif}.sd-header-info{margin-top:10px}
.sd-client-search-row{display:flex;align-items:center;gap:15px}.sd-search-label{color:#d4af37;font-weight:600}.sd-search-wrap{position:relative}
.sd-search-input{padding:10px 40px 10px 15px;background:rgba(255,255,255,0.1);border:2px solid #d4af37;border-radius:25px;color:white;font-size:14px;width:300px;outline:none}
.sd-search-input::placeholder{color:rgba(255,255,255,0.5)}.sd-search-icon{position:absolute;right:15px;top:50%;transform:translateY(-50%);color:#d4af37}
.sd-dropdown{position:absolute;z-index:100;width:100%;max-height:250px;overflow-y:auto;background:#0d1f2d;border:2px solid #d4af37;border-radius:12px;margin-top:5px;box-shadow:0 10px 40px rgba(0,0,0,0.5)}
.sd-dropdown-item{padding:12px 18px;cursor:pointer;border-bottom:1px solid rgba(45,80,112,0.3);transition:background 0.2s}.sd-dropdown-item:hover{background:rgba(212,175,67,0.2)}
.sd-dropdown-name{color:#d4af37;font-weight:600;font-size:0.95rem}.sd-dropdown-contact{color:#7aa0c0;font-size:0.8rem;margin-top:2px}
.sd-client-badge-row{display:flex;align-items:center;gap:15px}.sd-client-badge{background:rgba(212,175,55,0.2);color:#d4af37;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600}
.sd-divider{color:#b0b0b0}.sd-contact-name{color:#b8d4e8}
.sd-change-btn{background:rgba(231,76,60,0.3);border:none;color:#ff6b6b;padding:6px 12px;border-radius:15px;cursor:pointer;font-size:12px;margin-left:10px}.sd-change-btn:hover{background:rgba(231,76,60,0.5)}
.sd-offers-row{margin-top:10px;padding:12px;background:rgba(30,58,95,0.5);border-radius:12px;border:1px solid rgba(212,168,67,0.3)}
.sd-offers-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.sd-offers-label{color:#d4af37;font-weight:600;font-size:0.9rem}.sd-offers-count{color:#7aa0c0;font-size:0.8rem}
.sd-offers-list{display:flex;flex-wrap:wrap;gap:8px;max-height:120px;overflow-y:auto}
.sd-offer-card{background:linear-gradient(135deg,rgba(10,22,40,0.8),rgba(13,31,45,0.8));border:2px solid transparent;border-radius:10px;padding:10px 14px;cursor:pointer;min-width:180px;transition:all 0.2s}
.sd-offer-card:hover{border-color:#d4af37;transform:translateY(-2px)}.sd-offer-card.selected{border-color:#d4af37;background:linear-gradient(135deg,#1e3a5f,#2a4a6f)}
.sd-offer-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.sd-offer-id{color:#d4af37;font-weight:600;font-size:0.85rem}
.sd-offer-status{padding:2px 8px;border-radius:8px;font-size:0.7rem;text-transform:uppercase}
.sd-offer-card-bot{display:flex;justify-content:space-between;align-items:center}.sd-offer-date{color:#7aa0c0;font-size:0.75rem}.sd-offer-total{color:#fff;font-size:0.8rem}.sd-offer-members{color:#95a5a6;font-size:0.75rem;margin-top:4px}
.sd-close-btn{background:rgba(255,255,255,0.2);border:none;color:white;width:50px;height:50px;border-radius:50%;cursor:pointer;font-size:1.8rem;transition:all 0.3s;flex-shrink:0}.sd-close-btn:hover{background:rgba(231,76,60,0.8);transform:scale(1.1)}
.sd-body{flex:1;overflow-y:auto;padding:25px 30px;background:#3d5a80;display:flex;flex-direction:column;gap:20px;min-height:0}
.sd-two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sd-section{background:#0d1f2d;border-radius:16px;border:1px solid rgba(45,80,112,0.35);overflow:hidden}
.sd-section-hdr{background:linear-gradient(135deg,#1e3a5f,#2a4a6f);padding:16px 20px;display:flex;align-items:center;gap:12px}
.sd-section-hdr h3{color:white;margin:0;font-size:1.1rem;font-family:'Montserrat',sans-serif}.sd-section-icon{font-size:1.4rem}.sd-section-body{padding:20px}
.sd-doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.sd-doc-item{display:flex;align-items:center;gap:14px;padding:16px 18px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:12px;cursor:pointer;transition:all 0.3s;min-height:60px;position:relative}
.sd-doc-item:hover{border-color:#d4af37;background:rgba(212,175,55,0.05)}.sd-doc-item.checked{border-color:#4CAF50;background:rgba(76,175,80,0.15)}.sd-doc-item.available{border-color:#27ae60}
.sd-doc-item.cq{border-color:#8b5cf6}.sd-doc-item.cq.checked{border-color:#8b5cf6;background:rgba(139,92,246,0.15)}
.sd-doc-item input[type="checkbox"]{width:26px;height:26px;cursor:pointer;accent-color:#4CAF50}
.sd-doc-label{flex:1;display:flex;flex-direction:column}.sd-doc-name{color:#fff;font-weight:600;font-size:1rem}.sd-doc-desc{color:#7aa0c0;font-size:0.8rem;margin-top:2px}
.sd-doc-badge{position:absolute;top:5px;right:5px;background:#27ae60;color:white;font-size:0.65rem;padding:2px 6px;border-radius:8px}
.sd-prog-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;overflow:visible}
.sd-prog-item{display:flex;flex-direction:column;align-items:center;padding:14px 10px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:12px;cursor:pointer;transition:all 0.3s;text-align:center}
.sd-prog-item:hover{border-color:#d4af37;transform:translateY(-2px)}.sd-prog-item.checked{border-color:#4CAF50;background:rgba(76,175,80,0.15)}
.sd-prog-item.highlighted{border-color:#d4af37;background:rgba(212,175,55,0.2);box-shadow:0 0 15px rgba(212,175,55,0.3)}
.sd-prog-item input[type="checkbox"]{width:22px;height:22px;margin-bottom:8px;accent-color:#4CAF50}.sd-prog-icon{font-size:1.8rem;margin-bottom:6px}
.sd-prog-name{color:#fff;font-weight:600;font-size:0.9rem}.sd-prog-limit{color:#7aa0c0;font-size:0.7rem;margin-top:4px}.sd-hint-star{margin-left:auto;font-size:0.8rem;color:#d4af37}
.sd-split-item{padding:0!important;overflow:hidden;display:flex!important;flex-direction:row!important;border:2px dashed #d4af37!important;background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.05))!important}
.sd-split-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 5px;cursor:pointer;transition:all 0.2s}
.sd-split-btn.drive{border-right:1px solid rgba(212,175,55,0.3)}.sd-split-btn.drive:hover{background:rgba(66,133,244,0.2)}.sd-split-btn.local:hover{background:rgba(76,175,80,0.2)}
.sd-split-icon{font-size:1.6rem}.sd-split-label{color:#d4af37;font-size:0.7rem;font-weight:600}
.sd-format-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.sd-field-label{display:block;color:#7aa0c0;font-size:0.85rem;margin-bottom:6px}
.sd-select{width:100%;padding:12px 14px;background:rgba(10,22,40,0.8);border:1px solid rgba(45,80,112,0.5);border-radius:8px;color:white;font-size:0.9rem;cursor:pointer;outline:none}.sd-select:focus{border-color:#d4af37}
.sd-format-hint{margin-top:6px;font-size:0.75rem;color:#d4a843}
.sd-sig-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.sd-sig-toggle{display:flex;align-items:center;gap:12px;padding:14px 20px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:12px;cursor:pointer;transition:all 0.3s}
.sd-sig-toggle.active{border-color:#9c27b0;background:rgba(156,39,176,0.15)}.sd-sig-toggle input[type="checkbox"]{width:24px;height:24px;accent-color:#9c27b0}.sd-sig-toggle span{color:white;font-weight:600}
.sd-sig-select{flex:1;padding:14px 18px;background:rgba(10,22,40,0.8);border:2px solid rgba(45,80,112,0.35);border-radius:12px;color:white;font-size:1rem;cursor:pointer;min-width:250px}.sd-sig-select:disabled{opacity:0.5}.sd-sig-select:focus{outline:none;border-color:#9c27b0}
.sd-footer{background:#0d1f2d;padding:12px 30px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(45,80,112,0.35);flex-shrink:0;gap:15px}
.sd-attach-count{background:rgba(76,175,80,0.2);color:#4CAF50;padding:6px 14px;border-radius:20px;font-weight:600;font-size:0.85rem;white-space:nowrap}
.sd-footer-docs{display:flex;flex-wrap:wrap;gap:4px;flex:1;max-height:30px;overflow:hidden}
.sd-footer-doc-tag{background:rgba(30,58,95,0.6);color:#b8d4e8;padding:3px 10px;border-radius:12px;font-size:0.75rem}.sd-footer-doc-tag.prog{background:rgba(212,175,55,0.2);color:#d4af37}
.sd-no-docs{color:#7aa0c0;font-size:0.8rem}.sd-footer-actions{display:flex;gap:12px}
.sd-btn{padding:10px 24px;border:none;border-radius:25px;font-family:'Montserrat',sans-serif;font-weight:600;cursor:pointer;transition:all 0.3s;font-size:0.95rem;display:flex;align-items:center;gap:8px}
.sd-btn:disabled{opacity:0.5;cursor:not-allowed}
.sd-btn.cancel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6)}.sd-btn.cancel:hover{background:rgba(255,255,255,0.1)}
.sd-btn.preview{background:rgba(45,80,112,0.5);border:1px solid rgba(45,80,112,0.6);color:#b8d4e8}.sd-btn.preview:hover{background:rgba(45,80,112,0.7);transform:translateY(-2px)}
.sd-btn.draft{background:linear-gradient(135deg,#f39c12,#e67e22);color:white}.sd-btn.draft:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 20px rgba(243,156,18,0.4)}
.sd-btn.email{background:linear-gradient(135deg,#D4AF37,#c49932);color:#0a1628;padding:10px 32px;font-size:1rem}
.sd-btn.email:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(212,175,55,0.4)}
@media(max-width:1024px){.sd-body{padding:15px}.sd-prog-grid{grid-template-columns:repeat(3,1fr)}.sd-two-col{grid-template-columns:1fr}.sd-header{padding:15px 20px}.sd-title{font-size:1.3rem}.sd-footer{flex-direction:column;gap:15px}}
@media(max-width:600px){.sd-doc-grid{grid-template-columns:1fr}.sd-prog-grid{grid-template-columns:repeat(2,1fr)}.sd-format-grid{grid-template-columns:1fr}.sd-sig-row{flex-direction:column}.sd-sig-select{width:100%}.sd-search-input{width:200px}}
    `}</style>
  </div>);
}
