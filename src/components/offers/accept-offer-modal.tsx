'use client';
import React, { useState, useEffect, useCallback } from 'react';

interface Props { offer: any; onClose: () => void; onAccepted: (offerId: string) => void; }

const DOC_TYPES = [
  { key: 'nda', label: 'NDA', icon: '🔒', color: '#e74c3c', desc: 'Non-Disclosure Agreement', cqOnly: false },
  { key: 'dpa', label: 'DPA', icon: '🛡️', color: '#f39c12', desc: 'Data Processing Agreement', cqOnly: false },
  { key: 'asa', label: 'ASA', icon: '📋', color: '#3498db', desc: 'Administrative Services Agreement', cqOnly: false },
  { key: 'proposal', label: 'Proposal', icon: '📄', color: '#27ae60', desc: 'Financial Proposal', cqOnly: false },
  { key: 'comparison_quote', label: 'Comparison Quote', icon: '📊', color: '#8b5cf6', desc: 'Multi-plan comparison', cqOnly: true },
];

export default function AcceptOfferModal({ offer, onClose, onAccepted }: Props) {
  const [notes, setNotes] = useState('');
  const [docs, setDocs] = useState<Record<string, any>>({});
  const [docsLoading, setDocsLoading] = useState(true);
  const [status, setStatus] = useState<{ msg: string; type: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const isCQ = offer.offer_type === 'comparison' || (offer.offer_id && offer.offer_id.startsWith('CQ-'));
  const clientName = (offer.client_name || 'Unknown').replace(/^[\s]*[🏢└─\s]+/g, '').trim();
  const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plans = (() => { const p: any[] = []; try { if (offer.items?.length > 0) offer.items.forEach((i: any) => p.push({ name: i.plan_name||'Plan', principals: parseInt(i.principals)||0, dependents: parseInt(i.dependents)||0, regFee: parseFloat(i.reg_fee||0), fundDeposit: parseFloat(i.fund_deposit||0) })); else if (isCQ && offer.comparison_data) { let cd = typeof offer.comparison_data === 'string' ? JSON.parse(offer.comparison_data) : offer.comparison_data; if (!Array.isArray(cd)) cd=[cd]; cd.forEach((x: any) => p.push({ name: x.planName||x.plan_name||'Plan', principals: parseInt(x.principals)||0, dependents: parseInt(x.dependents)||0, regFee: parseFloat(x.regFee||x.reg_fee||0), fundDeposit: parseFloat(x.fundDeposit||x.fund_deposit||0) })); } } catch(e){} return p; })();

  useEffect(() => { (async () => { try { const r = await fetch('/api/proxy/getAllOffersDocuments'); const d = await r.json(); if (d.success && d.data?.[offer.offer_id]) setDocs(d.data[offer.offer_id]); } catch(e){} setDocsLoading(false); })(); }, [offer.offer_id]);

  const filteredDocs = DOC_TYPES.filter(dt => !dt.cqOnly || isCQ);
  const genCount = filteredDocs.filter(dt => { const d = docs[dt.key]; return d && (d.fileId || d.fileUrl || typeof d === 'string'); }).length;

  const confirmAccept = useCallback(async () => {
    setAccepting(true); setStatus({ msg: '⏳ Updating offer status...', type: 'loading' });
    const np = notes.trim() ? 'Accepted by client. ' + notes.trim() : 'Accepted by client';
    try {
      const r = await fetch(`/api/proxy/updateOfferStatus?offerId=${encodeURIComponent(offer.offer_id)}&status=accepted&notes=${encodeURIComponent(np)}`);
      const d = await r.json();
      if (d.success) {
        try { const fr = await fetch('/api/proxy/ensureSignedFolder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ensureSignedFolder', offerId: offer.offer_id, clientName }) }); const fd = await fr.json(); if (fd.success && fd.folderUrl) setDriveFolderUrl(fd.folderUrl); } catch(e){}
        setAccepted(true); setStatus({ msg: '✅ Offer accepted successfully!', type: 'success' }); onAccepted(offer.offer_id);
      } else { setStatus({ msg: '❌ ' + (d.error || 'Failed'), type: 'error' }); setAccepting(false); }
    } catch (e: any) { setStatus({ msg: '❌ ' + e.message, type: 'error' }); setAccepting(false); }
  }, [offer, notes, clientName, onAccepted]);

  return (<div className="ao-fs">
    <div className="ao-hdr"><div className="ao-hdr-l"><h2 className="ao-ttl">✅ Accept Offer</h2><div className="ao-badges"><span className="ao-bdg gold">{offer.offer_id}</span><span className="ao-div">|</span><span className="ao-cln">{clientName}</span><span className="ao-div">|</span><span className="ao-stl">Status: <strong className="ao-stv">{(offer.status||'draft').toUpperCase()}</strong></span>{isCQ&&<span className="ao-bdg purple">📊 CQ</span>}</div></div><button className="ao-x" onClick={onClose}>✕</button></div>
    <div className="ao-bd">{!accepted?(<><div className="ao-col">
      <div className="ao-sec"><div className="ao-sh"><span className="ao-si">📋</span><h3>Offer Summary</h3></div><div className="ao-sb">{plans.length>0?(<>{plans.map((p,i)=>{const t=p.principals+p.dependents;const s=(p.regFee+p.fundDeposit)*t;return(<div key={i} className={`ao-pr ${isCQ?'cq':''}`}><div><strong className={`ao-pn ${isCQ?'cq':''}`}>{p.name}</strong><div className="ao-pd">{p.principals}P + {p.dependents}D = {t} members</div></div><div className="ao-prt"><div className="ao-pa">{fmtUSD(s)}</div><div className="ao-pf">Reg: ${p.regFee} | Fund: ${p.fundDeposit}</div></div></div>)})}</>):(<div className="ao-np">No plan breakdown available</div>)}</div></div>
      <div className="ao-sec"><div className="ao-sh"><span className="ao-si">💰</span><h3>Financial Summary</h3></div><div className="ao-sb"><div className="ao-fg"><div className="ao-fc"><div className="ao-fl">Total Members</div><div className="ao-fv blue">{offer.total_members||0}</div><div className="ao-fs2">{offer.total_principals||0}P + {offer.total_dependents||0}D</div></div><div className="ao-fc"><div className="ao-fl">Registration Fees</div><div className="ao-fv">{fmtUSD(offer.subtotal_reg_fees||0)}</div></div><div className="ao-fc"><div className="ao-fl">Fund Deposit</div><div className="ao-fv">{fmtUSD(offer.subtotal_fund_deposit||0)}</div></div>{offer.includes_dental&&<div className="ao-fc"><div className="ao-fl">Dental</div><div className="ao-fv purple">{fmtUSD(offer.subtotal_dental||0)}</div></div>}<div className="ao-fc total"><div className="ao-fl">Grand Total</div><div className="ao-fv gold">{fmtUSD(offer.grand_total_usd||0)}</div></div></div></div></div>
      <div className="ao-sec"><div className="ao-sh"><span className="ao-si">📂</span><h3>Generated Documents</h3></div><div className="ao-sb">{docsLoading?(<div className="ao-ld">⏳ Loading documents...</div>):(<><div className="ao-dc"><span>📁 Documents in Drive</span><span className={`ao-dcc ${genCount===filteredDocs.length?'ok':genCount>0?'part':'no'}`}>{genCount}/{filteredDocs.length} generated</span></div>{filteredDocs.map(dt=>{const d=docs[dt.key];const has=d&&(d.fileId||d.fileUrl||typeof d==='string');const url=has?(typeof d==='string'?d:d.fileUrl||(d.fileId?`https://drive.google.com/file/d/${d.fileId}/view`:'#')):'';return(<div key={dt.key} className={`ao-dr ${has?'av':'mi'}`}><span className="ao-di">{dt.icon}</span><div className="ao-dif"><div className="ao-dn" style={{color:dt.color}}>{dt.label}</div><div className="ao-dd">{dt.desc}</div></div>{has?(<><span className="ao-db">✅ v{d.version||1}</span><a href={url} target="_blank" rel="noreferrer" className="ao-dl">Open ↗</a></>):(<span className="ao-dm">— Not generated</span>)}</div>)})}</>)}</div></div>
    </div><div className="ao-col">
      <div className="ao-sec"><div className="ao-sh"><span className="ao-si">📝</span><h3>Acceptance Notes</h3></div><div className="ao-sb"><textarea className="ao-nt" placeholder="e.g. Client confirmed via email..." value={notes} onChange={e=>setNotes(e.target.value)} rows={8}/></div></div>
      <div className="ao-sec"><div className="ao-sh"><span className="ao-si">⚠️</span><h3>Important Information</h3></div><div className="ao-sb"><div className="ao-wb"><p><strong>After accepting:</strong> Status changes to <strong style={{color:'#27ae60'}}>&quot;accepted&quot;</strong>.</p><p>You can then send documents for signature.</p></div><div className="ao-tb">💡 If the client has NOT confirmed yet — close this modal and wait.</div></div></div>
      {status&&<div className={`ao-sm ${status.type}`}>{status.msg}</div>}
    </div></>):(
      <div className="ao-acc-full"><div className="ao-sec"><div className="ao-sh" style={{background:'linear-gradient(135deg,#27ae60,#219a52)'}}><span className="ao-si">✅</span><h3>Offer Accepted!</h3></div><div className="ao-sb"><div className="ao-sc"><div className="ao-sci">✅</div><div className="ao-sct">Status changed to &quot;accepted&quot;</div><div className="ao-scs">{offer.offer_id} — {clientName}</div><div className="ao-nb"><div className="ao-nbl">📋 Next: Upload Signed Documents</div><div className="ao-nbd">Ο φάκελος <strong style={{color:'#1abc9c'}}>&quot;Signed Documents&quot;</strong> είναι έτοιμος.</div></div><div className="ao-acs"><div className="ao-ac up"><span className="ao-aci">📤</span><span className="ao-acl up">Upload Signed Docs</span></div><div className="ao-ac dr" onClick={()=>window.open(driveFolderUrl||'https://drive.google.com','_blank')}><span className="ao-aci">📁</span><span className="ao-acl dr">Open in Drive</span></div></div><div className="ao-ft">💡 Μπορείς να ανεβάσεις αργότερα — θα βρεις ✅ Signed στον πίνακα.</div></div></div></div></div>
    )}</div>
    <div className="ao-ftr">{!accepted?(<><div className="ao-fi"><span className="ao-fo">{offer.offer_id}</span><span className="ao-fcn">{clientName}</span><span className="ao-ftl">{fmtUSD(offer.grand_total_usd||0)}</span></div><div className="ao-fa"><button className="ao-btn cn" onClick={onClose}>Cancel</button><button className="ao-btn ac" onClick={confirmAccept} disabled={accepting}>{accepting?'⏳ Processing...':'✅ Accept Offer'}</button></div></>):(<div className="ao-fa"><button className="ao-btn dn" onClick={onClose}>✅ Done — Close</button></div>)}</div>
    <style jsx>{`
.ao-fs{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;flex-direction:column;z-index:99999;backdrop-filter:blur(8px)}
.ao-hdr{background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:20px 30px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;border-bottom:3px solid #27ae60}
.ao-hdr-l{flex:1}.ao-ttl{color:white;margin:0;font-size:1.6rem;font-family:'Montserrat',sans-serif}
.ao-badges{display:flex;align-items:center;gap:15px;margin-top:10px;flex-wrap:wrap}
.ao-bdg{padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600}.ao-bdg.gold{background:rgba(212,175,55,0.2);color:#d4af37}.ao-bdg.purple{background:rgba(139,92,246,0.2);color:#8b5cf6}
.ao-div{color:#b0b0b0}.ao-cln{color:white;font-weight:600;font-size:1rem}.ao-stl{color:#b8d4e8}.ao-stv{color:#f39c12}
.ao-x{background:rgba(255,255,255,0.2);border:none;color:white;width:50px;height:50px;border-radius:50%;cursor:pointer;font-size:1.8rem;transition:all 0.3s;flex-shrink:0}.ao-x:hover{background:rgba(231,76,60,0.8);transform:scale(1.1)}
.ao-bd{flex:1;overflow-y:auto;padding:25px 30px;display:grid;grid-template-columns:1fr 1fr;gap:30px;background:#3d5a80}
.ao-col{display:flex;flex-direction:column;gap:20px}.ao-acc-full{grid-column:1/-1}
.ao-sec{background:#2d3748;border-radius:16px;border:1px solid #4a5568;overflow:hidden}
.ao-sh{background:linear-gradient(135deg,#1e3a5f,#2a4a6f);padding:16px 20px;display:flex;align-items:center;gap:12px}
.ao-sh h3{color:white;margin:0;font-size:1.1rem;font-family:'Montserrat',sans-serif}.ao-si{font-size:1.4rem}.ao-sb{padding:20px}
.ao-pr{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.15);border-radius:10px;margin-bottom:8px}
.ao-pr.cq{background:rgba(139,92,246,0.06);border-color:rgba(139,92,246,0.15)}
.ao-pn{color:#27ae60;font-weight:700;font-size:1.05rem}.ao-pn.cq{color:#8b5cf6}
.ao-pd{color:rgba(255,255,255,0.4);font-size:0.8rem;margin-top:2px}.ao-prt{text-align:right}
.ao-pa{color:white;font-weight:700;font-size:1.1rem}.ao-pf{color:rgba(255,255,255,0.35);font-size:0.75rem}
.ao-np{color:rgba(255,255,255,0.4);text-align:center;padding:2rem;font-size:0.9rem}
.ao-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ao-fc{background:rgba(13,31,45,0.7);border:1px solid rgba(45,80,112,0.35);border-radius:14px;padding:1.25rem;text-align:center}
.ao-fc.total{border-color:rgba(212,175,55,0.5);background:rgba(212,175,55,0.08)}
.ao-fl{font-size:0.8rem;color:#7aa0c0;margin-bottom:0.3rem}
.ao-fv{font-family:'Montserrat',sans-serif;font-size:1.5rem;font-weight:700;color:#fff}
.ao-fv.blue{color:#5dade2}.ao-fv.purple{color:#9b59b6}.ao-fv.gold{color:#D4AF37;font-size:1.8rem}
.ao-fs2{font-size:0.75rem;color:#667788;margin-top:0.2rem}
.ao-ld{text-align:center;padding:1.5rem;color:rgba(255,255,255,0.4)}
.ao-dc{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.ao-dc span:first-child{color:rgba(255,255,255,0.5);font-size:0.85rem}.ao-dcc{font-weight:700;font-size:0.9rem}
.ao-dcc.ok{color:#27ae60}.ao-dcc.part{color:#f39c12}.ao-dcc.no{color:#e74c3c}
.ao-dr{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;margin-bottom:8px}
.ao-dr.av{background:rgba(39,174,96,0.06);border:1px solid rgba(39,174,96,0.15)}.ao-dr.mi{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);opacity:0.5}
.ao-di{font-size:1.4rem}.ao-dif{flex:1}.ao-dn{font-weight:700;font-size:1rem}.ao-dd{color:rgba(255,255,255,0.35);font-size:0.75rem}
.ao-db{background:rgba(39,174,96,0.15);color:#27ae60;font-size:0.8rem;padding:4px 10px;border-radius:8px;font-weight:600}
.ao-dl{background:rgba(93,173,226,0.1);color:#5dade2;text-decoration:none;padding:6px 12px;border-radius:8px;font-size:0.85rem;font-weight:600;border:1px solid rgba(93,173,226,0.2);transition:all 0.2s}
.ao-dl:hover{background:rgba(93,173,226,0.2)}.ao-dm{color:rgba(255,255,255,0.25);font-size:0.85rem}
.ao-nt{width:100%;min-height:180px;background:#1a2332;border:2px solid #4a5568;border-radius:12px;color:white;padding:1rem;font-size:0.95rem;resize:vertical;font-family:inherit;box-sizing:border-box}
.ao-nt:focus{border-color:#27ae60;outline:none}.ao-nt::placeholder{color:rgba(255,255,255,0.3)}
.ao-wb{background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.2);border-radius:12px;padding:1rem 1.25rem;color:#f39c12;font-size:0.9rem;line-height:1.6;margin-bottom:12px}
.ao-wb p{margin:0 0 0.5rem}.ao-wb p:last-child{margin-bottom:0}
.ao-tb{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:1rem 1.25rem;color:#d4a843;font-size:0.9rem}
.ao-sm{padding:12px 20px;border-radius:12px;text-align:center;font-size:0.9rem}
.ao-sm.success{background:rgba(39,174,96,0.15);color:#27ae60}.ao-sm.error{background:rgba(231,76,60,0.15);color:#e74c3c}.ao-sm.loading{background:rgba(243,156,18,0.15);color:#f39c12}
.ao-sc{text-align:center;padding:1rem 0}.ao-sci{font-size:4rem;margin-bottom:0.75rem}.ao-sct{color:#27ae60;font-size:1.5rem;font-weight:700;font-family:'Montserrat',sans-serif}
.ao-scs{color:rgba(255,255,255,0.5);font-size:1rem;margin-top:0.25rem;margin-bottom:2rem}
.ao-nb{background:rgba(0,0,0,0.2);border-radius:14px;padding:1.25rem;margin-bottom:1.5rem;text-align:left;max-width:600px;margin-left:auto;margin-right:auto}
.ao-nbl{color:rgba(255,255,255,0.5);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.ao-nbd{color:rgba(255,255,255,0.6);font-size:0.9rem;line-height:1.6}
.ao-acs{display:flex;gap:16px;max-width:500px;margin:0 auto 1.5rem}
.ao-ac{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:1.5rem 1rem;border:2px dashed;border-radius:16px;cursor:pointer;transition:all 0.2s}
.ao-ac.up{border-color:rgba(26,188,156,0.3);background:rgba(26,188,156,0.08)}.ao-ac.up:hover{background:rgba(26,188,156,0.15);border-color:rgba(26,188,156,0.6)}
.ao-ac.dr{border-color:rgba(66,133,244,0.3);background:rgba(66,133,244,0.08)}.ao-ac.dr:hover{background:rgba(66,133,244,0.15);border-color:rgba(66,133,244,0.6)}
.ao-aci{font-size:2.5rem}.ao-acl{font-weight:700;font-size:1rem}.ao-acl.up{color:#1abc9c}.ao-acl.dr{color:#4285f4}
.ao-ft{background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:10px 16px;font-size:0.85rem;color:#d4a843;max-width:500px;margin:0 auto}
.ao-ftr{background:#2d3748;padding:12px 30px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #4a5568;flex-shrink:0}
.ao-fi{display:flex;gap:20px;align-items:center}.ao-fo{color:#d4af37;font-weight:700;font-family:monospace;font-size:0.95rem}.ao-fcn{color:white;font-weight:600}.ao-ftl{color:#27ae60;font-weight:700;font-size:1.1rem}
.ao-fa{display:flex;gap:12px}
.ao-btn{padding:10px 24px;border-radius:12px;cursor:pointer;font-size:0.95rem;font-family:'Montserrat',sans-serif;font-weight:600;transition:all 0.2s}
.ao-btn.cn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6)}.ao-btn.cn:hover{background:rgba(255,255,255,0.1)}
.ao-btn.ac{background:linear-gradient(135deg,#27ae60,#219a52);border:none;color:white;padding:10px 32px;box-shadow:0 4px 15px rgba(39,174,96,0.3)}
.ao-btn.ac:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(39,174,96,0.4)}.ao-btn.ac:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.ao-btn.dn{background:linear-gradient(135deg,#27ae60,#219a52);border:none;color:white;padding:10px 32px}
@media(max-width:1024px){.ao-bd{grid-template-columns:1fr;padding:15px}.ao-fg{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.ao-hdr{padding:15px 20px}.ao-ttl{font-size:1.3rem}.ao-fg{grid-template-columns:1fr}.ao-ftr{flex-direction:column;gap:15px}.ao-acs{flex-direction:column}}
    `}</style></div>);
}
