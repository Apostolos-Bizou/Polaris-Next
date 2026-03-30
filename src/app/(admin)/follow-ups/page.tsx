"use client";

import { useState, useRef, useEffect } from "react";
import { useFollowUpDashboard } from "@/hooks/use-follow-ups";
import type { GroupedClient, PipelineOffer } from "@/hooks/use-follow-ups";
import "./follow-ups.css";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) => "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/* ---- Navigate to Offers with status filter ---- */
function goToOffersFiltered(status: string) {
  window.location.href = "/offers?filterStatus=" + encodeURIComponent(status);
}

/* ---- Handoff to Email Center ---- */
function emailHandoff(clientName: string, template?: string) {
  localStorage.setItem("polaris_followup_email", JSON.stringify({
    type: "followUpEmail", clientName, template: template || "", source: "follow-ups", timestamp: Date.now(),
  }));
  window.location.href = "/email?followUpEmail=true";
}

/* ---- Full Offer interface ---- */
interface FullOffer {
  offer_id: string;
  offer_type: string;
  client_id: string;
  client_name: string;
  contact_person: string;
  contact_email: string;
  status: string;
  created_date: string;
  total_principals: number;
  total_dependents: number;
  total_members: number;
  subtotal_reg_fees: number;
  subtotal_fund_deposit: number;
  subtotal_dental: number;
  grand_total_usd: number;
  includes_dental: boolean;
  items: Array<{ plan_name: string; principals: number; dependents: number; reg_fee: number; fund_deposit: number; subtotal_reg: number; subtotal_fund: number }>;
}

/* ---- Full Offer Detail Modal ---- */
function OfferDetailModal({ offerId, preview, onClose }: { offerId: string; preview: PipelineOffer; onClose: () => void }) {
  const [offer, setOffer] = useState<FullOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, { fileUrl: string; fileName: string }>>({});
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/proxy/getOffers").then(r => r.json()).then(data => {
      if (!mounted) return;
      const found = (data.data || []).find((o: any) => o.offer_id === offerId);
      if (found) {
        setOffer({
          offer_id: found.offer_id, offer_type: found.offer_id?.startsWith("CQ-") ? "comparison" : "standard",
          client_id: found.client_id || "", client_name: (found.client_name || "").replace(/^[\s]*[\u{1F3DB}\u{1F3E2}\u2514\u2500\s\uFE0F]+/gu, "").replace(/\s*\[.*?\]/gi, "").trim(),
          contact_person: found.contact_person || "", contact_email: found.contact_email || "", status: found.status || "draft",
          created_date: found.created_date || found.offer_date || "",
          total_principals: Number(found.total_principals || 0), total_dependents: Number(found.total_dependents || 0), total_members: Number(found.total_members || 0),
          subtotal_reg_fees: Number(found.subtotal_reg_fees || 0), subtotal_fund_deposit: Number(found.subtotal_fund_deposit || 0),
          subtotal_dental: Number(found.subtotal_dental || 0), grand_total_usd: Number(found.grand_total_usd || 0),
          includes_dental: found.includes_dental === true || found.includes_dental === "true",
          items: (found.items || []).map((it: any) => ({ plan_name: it.plan_name || "", principals: Number(it.principals || 0), dependents: Number(it.dependents || 0), reg_fee: Number(it.reg_fee_per_person || it.reg_fee || 0), fund_deposit: Number(it.fund_deposit_per_person || it.fund_deposit || 0), subtotal_reg: Number(it.subtotal_reg || 0), subtotal_fund: Number(it.subtotal_fund || 0) })),
        });
      }
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [offerId]);

  const SC: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    draft: { label: "Draft", color: "#90A4AE", bg: "rgba(144,164,174,0.15)", icon: "\uD83D\uDCDD" },
    sent: { label: "Sent", color: "#42A5F5", bg: "rgba(66,165,245,0.15)", icon: "\uD83D\uDCE7" },
    pending_signature: { label: "Pending Sign", color: "#AB47BC", bg: "rgba(171,71,188,0.15)", icon: "\u270F\uFE0F" },
    accepted: { label: "Accepted", color: "#66BB6A", bg: "rgba(102,187,106,0.15)", icon: "\u2705" },
    signed: { label: "Signed", color: "#26A69A", bg: "rgba(38,166,154,0.15)", icon: "\uD83D\uDCDD" },
  };
  const sc = SC[offer?.status || "draft"] || SC.draft;

  const generateDoc = async (type: string) => {
    if (!offer) return; setGeneratingDoc(type); setDocError(null);
    try {
      let url = "";
      if (type === "nda") url = `/api/proxy/createNDA?clientId=${encodeURIComponent(offer.client_id)}&offerId=${encodeURIComponent(offer.offer_id)}`;
      else if (type === "dpa") url = `/api/proxy/createDPA?clientId=${encodeURIComponent(offer.client_id)}&offerId=${encodeURIComponent(offer.offer_id)}`;
      else if (type === "asa") url = `/api/proxy/createASAFromOffer?offerId=${encodeURIComponent(offer.offer_id)}`;
      else if (type === "proposal") url = `/api/proxy/createProposalFromOffer?offerId=${encodeURIComponent(offer.offer_id)}`;
      const res = await fetch(url); const result = await res.json();
      if (result.success) { const docUrl = result.fileUrl || result.documentUrl || ""; setGeneratedDocs(prev => ({ ...prev, [type]: { fileUrl: docUrl, fileName: `${type.toUpperCase()} - ${offer.offer_id}` } })); if (docUrl) window.open(docUrl, "_blank"); }
      else setDocError(`Failed: ${result.error || "Unknown"}`);
    } catch (err: any) { setDocError(`Error: ${err.message}`); }
    setGeneratingDoc(null);
  };
  const generateAll = async () => { setGeneratingDoc("all"); for (const t of ["nda","dpa","asa","proposal"]) { try { await generateDoc(t); } catch {} } setGeneratingDoc(null); };
  const getDS = (t: string) => generatingDoc === t || generatingDoc === "all" ? "generating" : generatedDocs[t] ? "done" : "none";

  const o = offer;

  return (
    <div className="fud-modal-overlay" onClick={onClose}>
      <div className="fud-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="fud-modal-header">
          <div><h2 className="fud-modal-title">{offerId}</h2><p className="fud-modal-subtitle">{o ? o.client_name : preview.client_name}</p></div>
          <button className="fud-modal-close" onClick={onClose}>{"\u2715"}</button>
        </div>
        <div className="fud-modal-body">
          {loading ? (<div style={{ textAlign: "center", padding: "3rem", color: "rgba(184,212,232,0.6)" }}>Loading offer details...</div>) : !o ? (<div style={{ textAlign: "center", padding: "3rem", color: "rgba(184,212,232,0.6)" }}>Offer not found</div>) : (<>
            {/* Info Grid */}
            <div className="fud-modal-info-grid">
              <div className="fud-modal-info-item"><span className="fud-modal-info-label">Status</span><span className="fud-modal-status-badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span></div>
              <div className="fud-modal-info-item"><span className="fud-modal-info-label">Created</span><span className="fud-modal-info-value">{o.created_date ? new Date(o.created_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "-"}</span></div>
              <div className="fud-modal-info-item"><span className="fud-modal-info-label">Type</span><span className="fud-modal-info-value">{o.offer_type === "comparison" ? "Comparison Quote" : "Standard Offer"}</span></div>
              {o.contact_person && <div className="fud-modal-info-item"><span className="fud-modal-info-label">Contact</span><span className="fud-modal-info-value">{o.contact_person}</span></div>}
              {o.contact_email && <div className="fud-modal-info-item"><span className="fud-modal-info-label">Email</span><span className="fud-modal-info-value">{o.contact_email}</span></div>}
            </div>

            {/* Financial Summary - 5 cards */}
            <div className="fud-modal-section-title">{"\uD83D\uDCB0"} Financial Summary</div>
            <div className="fud-modal-fin-grid5">
              <div className="fud-modal-fin-card"><div className="fud-modal-fin-label">Members</div><div className="fud-modal-fin-value">{fmt(o.total_members)}</div><div className="fud-modal-fin-sub">{o.total_principals} principals + {o.total_dependents} dependents</div></div>
              <div className="fud-modal-fin-card"><div className="fud-modal-fin-label">Registration Fees</div><div className="fud-modal-fin-value">{fmtUsd(o.subtotal_reg_fees)}</div></div>
              <div className="fud-modal-fin-card"><div className="fud-modal-fin-label">Fund Deposit</div><div className="fud-modal-fin-value">{fmtUsd(o.subtotal_fund_deposit)}</div></div>
              <div className="fud-modal-fin-card"><div className="fud-modal-fin-label">Dental</div><div className="fud-modal-fin-value">{o.includes_dental ? fmtUsd(o.subtotal_dental) : "\u2014"}</div></div>
              <div className="fud-modal-fin-card total"><div className="fud-modal-fin-label">Grand Total</div><div className="fud-modal-fin-value gold">{fmtUsd(o.grand_total_usd)}</div></div>
            </div>

            {/* Plan Breakdown */}
            {o.items && o.items.length > 0 && (<>
              <div className="fud-modal-section-title">{"\uD83D\uDCCB"} Plan Breakdown</div>
              <div className="fud-modal-table-wrap"><table className="fud-modal-table"><thead><tr><th>Plan</th><th>Principals</th><th>Dependents</th><th>Reg Fee</th><th>Fund Deposit</th><th>Subtotal Reg</th><th>Subtotal Fund</th></tr></thead>
                <tbody>{o.items.map((item, i) => (<tr key={i}><td><strong>{item.plan_name}</strong></td><td>{item.principals}</td><td>{item.dependents}</td><td>${item.reg_fee}</td><td>${item.fund_deposit}</td><td>{fmtUsd(item.subtotal_reg)}</td><td>{fmtUsd(item.subtotal_fund)}</td></tr>))}</tbody>
              </table></div>
            </>)}

            {/* Generated Documents */}
            <div className="fud-modal-section-title">{"\uD83D\uDCC2"} Generated Documents</div>
            {docError && <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", color: "#EF5350", fontSize: "0.85rem" }}>{docError}</div>}
            <div className="fud-modal-doc-grid">
              {[{ key: "nda", name: "NDA", desc: "Non-Disclosure Agreement", color: "#e67e22" }, { key: "dpa", name: "DPA", desc: "Data Processing Agreement", color: "#9b59b6" }, { key: "asa", name: "ASA", desc: "Administrative Services Agreement", color: "#27ae60" }, { key: "proposal", name: "Proposal", desc: "Healthcare TPA Services Proposal", color: "#1e3a5f" }].map(doc => (
                <div key={doc.key} className={`fud-modal-doc-card ${getDS(doc.key)}`}>
                  <div className="fud-modal-doc-name">{doc.name}</div>
                  <div className="fud-modal-doc-desc">{doc.desc}</div>
                  {getDS(doc.key) === "done" ? (<a href={generatedDocs[doc.key]?.fileUrl} target="_blank" rel="noreferrer" className="fud-modal-doc-open">Open</a>) : (
                    <button className="fud-modal-doc-btn" style={{ background: doc.color }} onClick={() => generateDoc(doc.key)} disabled={generatingDoc !== null}>{generatingDoc === doc.key ? "Generating..." : "Generate"}</button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="fud-modal-actions">
              <button className="fud-modal-btn send-docs" onClick={() => { onClose(); emailHandoff(o.client_name); }}>{"\uD83D\uDCE7"} Send Email</button>
              <button className="fud-modal-btn generate" onClick={generateAll} disabled={generatingDoc !== null}>{generatingDoc === "all" ? "Generating All..." : "Generate All Documents"}</button>
              {o.client_id && <button className="fud-modal-btn client" onClick={() => window.location.href = "/clients/" + o.client_id}>{"\uD83C\uDFE2"} Client Folder</button>}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ---- Grouped Client Dropdown ---- */
function GroupedClientDropdown({ value, onChange, groupedClients, placeholder = "Select Client...", className = "" }: { value: string; onChange: (val: string) => void; groupedClients: GroupedClient[]; placeholder?: string; className?: string }) {
  const [open, setOpen] = useState(false); const [search, setSearch] = useState(""); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const filtered = groupedClients.map((g) => { const t = search.toLowerCase(); const pm = g.parent.name.toLowerCase().includes(t); const ms = g.subsidiaries.filter((s) => s.name.toLowerCase().includes(t)); if (!pm && ms.length === 0) return null; return { ...g, subsidiaries: pm ? g.subsidiaries : ms }; }).filter(Boolean) as GroupedClient[];
  return (<div ref={ref} className={`gcd-wrapper ${className}`}><button type="button" className={`gcd-trigger ${open ? "open" : ""} ${value ? "has-value" : ""}`} onClick={() => setOpen(!open)}><span className="gcd-trigger-text">{value || placeholder}</span><span className="gcd-chevron">{open ? "\u25B2" : "\u25BC"}</span></button>
    {open && (<div className="gcd-dropdown"><div className="gcd-search-wrap"><input className="gcd-search" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus /></div><div className="gcd-list">{filtered.length === 0 && <div className="gcd-empty">No clients found</div>}{filtered.map((g) => (<div key={g.parent.id} className="gcd-group"><div className={`gcd-parent ${value === g.parent.name ? "selected" : ""}`} onClick={() => { onChange(g.parent.name); setOpen(false); setSearch(""); }}><span className="gcd-parent-icon">{"\uD83C\uDFE2"}</span><span className="gcd-parent-name">{g.parent.name}</span>{g.subsidiaries.length > 0 && <span className="gcd-sub-count">{g.subsidiaries.length}</span>}</div>{g.subsidiaries.map((sub) => (<div key={sub.id} className={`gcd-sub ${value === sub.name ? "selected" : ""}`} onClick={() => { onChange(sub.name); setOpen(false); setSearch(""); }}><span className="gcd-sub-indent">{"\u2514"}</span><span className="gcd-sub-name">{sub.name}</span></div>))}</div>))}</div></div>)}
  </div>);
}

/* ---- Renew Confirmation Modal ---- */
function RenewModal({ contract, onClose }: { contract: { client_name: string; contract_name: string; members: number; days_left: number }; onClose: () => void }) {
  const createRenewalOffer = () => {
    localStorage.setItem("polaris_renewal", JSON.stringify({
      clientName: contract.client_name,
      contractName: contract.contract_name,
      members: contract.members,
      timestamp: Date.now(),
    }));
    window.location.href = "/offers?createRenewal=true";
  };
  const sendRenewalEmail = () => {
    onClose();
    emailHandoff(contract.client_name, contract.days_left <= 30 ? "renewal_urgent" : "renewal_reminder");
  };
  return (
    <div className="fud-modal-overlay" onClick={onClose}>
      <div className="fud-renew-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fud-renew-header">
          <h3 className="fud-renew-title">{"🔄"} Renewal</h3>
          <button className="fud-modal-close" onClick={onClose}>{"✕"}</button>
        </div>
        <div className="fud-renew-body">
          <div className="fud-renew-info">
            <div className="fud-renew-client">{contract.client_name}</div>
            <div className="fud-renew-contract">{contract.contract_name}</div>
            <div className="fud-renew-details">
              <span>{"👥"} {contract.members.toLocaleString()} members</span>
              <span className={"fud-days-badge " + (contract.days_left <= 30 ? "red" : contract.days_left <= 60 ? "orange" : "yellow")}>{contract.days_left}d remaining</span>
            </div>
          </div>
          <div className="fud-renew-actions">
            <button className="fud-renew-btn offer" onClick={createRenewalOffer}>
              <span className="fud-renew-btn-icon">{"📋"}</span>
              <span className="fud-renew-btn-text">Create Renewal Offer</span>
              <span className="fud-renew-btn-desc">Open Offers Center with pre-filled client data</span>
            </button>
            <button className="fud-renew-btn email" onClick={sendRenewalEmail}>
              <span className="fud-renew-btn-icon">{"📧"}</span>
              <span className="fud-renew-btn-text">Send Renewal Email</span>
              <span className="fud-renew-btn-desc">Open Email Center with renewal template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FollowUpsPage() {
  const fu = useFollowUpDashboard();
  const [selId, setSelId] = useState<string | null>(null);
  const [selPreview, setSelPreview] = useState<PipelineOffer | null>(null);
  const openOffer = (o: PipelineOffer) => { setSelId(o.offer_id); setSelPreview(o); };
  const closeOffer = () => { setSelId(null); setSelPreview(null); };
  const [renewContract, setRenewContract] = useState<any>(null);

  // Export PDF
  const exportPDF = async () => {
    try {
      const el = document.querySelector('.fud-page');
      if (!el) return;
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el as HTMLElement, { scale: 1.5, backgroundColor: '#0d1f2d', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let position = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (position < pdfH) {
        if (position > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, pdfW, pdfH);
        position += pageH;
      }
      pdf.save('Polaris_Follow_Up_Dashboard.pdf');
    } catch(e) { console.error('PDF error:', e); alert('PDF export requires jspdf and html2canvas packages.'); }
  };

  // Export Excel (CSV)
  const exportExcel = () => {
    const rows = [
      ['Polaris Follow-Up Dashboard'],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['PIPELINE SUMMARY'],
      ['Total Members', fu.totalMembers],
      ['Pipeline Value', fu.totalValue],
      ['In Progress', fu.pendingOffers],
      ['Expiring (90d)', fu.expiringCount],
      [''],
      ['DETAILED VIEW'],
      ['Client', 'Contact', 'Stage', 'Members', 'Value', 'Notes'],
      ...fu.detailedView.map(o => [o.client_name, o.contact_name || '', o.stage, o.members, o.value, o.last_note || '']),
      [''],
      ['EXPIRING CONTRACTS'],
      ['Client', 'Contract', 'Members', 'Expires', 'Days Left'],
      ...fu.allExpiring.map(e => [e.client_name, e.contract_name, e.members, e.expires, e.days_left]),
    ];
    const csv = rows.map(r => Array.isArray(r) ? r.map(v => typeof v === 'string' && v.includes(',') ? '"' + v + '"' : v).join(',') : r).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Polaris_Follow_Up_Dashboard.csv';
    link.click();
  };

  if (fu.loading) return <div className="fud-page"><div className="fud-loading">Loading Follow-up Dashboard...</div></div>;

  return (
    <div className="fud-page">
      {renewContract && <RenewModal contract={renewContract} onClose={() => setRenewContract(null)} />}
      {selId && selPreview && <OfferDetailModal offerId={selId} preview={selPreview} onClose={closeOffer} />}
      <div className="fud-header"><h1 className="fud-title">{"\uD83D\uDCCB"} Follow Up Dashboard</h1><div className="fud-header-actions"><button className="fud-export-btn">{"\uD83D\uDCC4"} Export PDF</button><button className="fud-export-btn">{"\uD83D\uDCCA"} Export Excel</button></div></div>
      <div className="fud-kpis">
        <div className="fud-kpi members clickable" onClick={() => goToOffersFiltered("all")}><div className="fud-kpi-icon">{"\uD83D\uDC65"}</div><div className="fud-kpi-value">{fmt(fu.totalMembers)}</div><div className="fud-kpi-label">Total Members</div><span className="fud-kpi-trend up">Pipeline</span></div>
        <div className="fud-kpi revenue clickable" onClick={() => goToOffersFiltered("all")}><div className="fud-kpi-icon">{"\uD83D\uDCB0"}</div><div className="fud-kpi-value">{fmtUsd(fu.totalValue)}</div><div className="fud-kpi-label">Pipeline Value</div><span className="fud-kpi-trend up">Total</span></div>
        <div className="fud-kpi pending clickable" onClick={() => goToOffersFiltered("sent")}><div className="fud-kpi-icon">{"\uD83D\uDCDD"}</div><div className="fud-kpi-value">{fu.pendingOffers}</div><div className="fud-kpi-label">In Progress</div><span className="fud-kpi-trend neutral">Sent/Pending/Accepted</span></div>
        <div className="fud-kpi expiring"><div className="fud-kpi-icon">{"\u26A0\uFE0F"}</div><div className="fud-kpi-value">{fu.expiringCount}</div><div className="fud-kpi-label">Expiring (90 days)</div><span className="fud-kpi-trend down">Action Required</span></div>
      </div>
      <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\uD83D\uDCCA"} Offers Pipeline</h2><button className="fud-refresh-btn" onClick={() => window.location.reload()}>{"\uD83D\uDD04"} Refresh</button></div>
        <div className="fud-pipeline-scroll"><div className="fud-pipeline-kanban">{fu.STAGE_ORDER.map((stage) => (<div key={stage} className={`fud-pipeline-col ${stage}`}><div className="fud-pipeline-col-header" style={{ background: `${fu.STAGE_COLORS[stage]}40`, color: fu.STAGE_COLORS[stage] }}>{fu.STAGE_LABELS[stage]} <span className="fud-pipeline-count">{fu.pipelineByStage[stage].length}</span></div><div className="fud-pipeline-col-body">{fu.pipelineByStage[stage].length === 0 ? <div className="fud-pipeline-empty">No offers</div> : fu.pipelineByStage[stage].map((offer) => (<div key={offer.offer_id} className="fud-pipeline-card" onClick={() => openOffer(offer)}><div className="fud-pipeline-card-top"><div className="fud-pipeline-card-client">{offer.client_name}</div><button className="fud-card-email-btn" title="Send Email" onClick={(e) => { e.stopPropagation(); emailHandoff(offer.client_name); }}>{"\uD83D\uDCE7"}</button></div><div className="fud-pipeline-card-value">{fmtUsd(offer.value)}</div>{offer.members > 0 && <div className="fud-pipeline-card-members">{fmt(offer.members)} members</div>}<div className="fud-pipeline-card-id">{offer.offer_id}</div></div>))}</div></div>))}</div></div>
      </div>
      <div className="fud-grid-2">
        <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\uD83D\uDCCA"} Offers Pipeline</h2></div><div className="fud-pipeline-bars">{fu.pipelineBars.map((bar) => (<div key={bar.stage} className="fud-bar-row clickable" onClick={() => goToOffersFiltered(bar.stage)}><span className="fud-bar-label">{bar.label}</span><div className="fud-bar-container"><div className="fud-bar-fill" style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}aa)` }} /></div><span className="fud-bar-count" style={{ color: bar.color }}>{bar.count}</span></div>))}</div></div>
        <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\uD83D\uDD14"} Action Required</h2></div><div className="fud-action-list">{fu.actionItems.map((item, i) => (<div key={i} className="fud-action-item clickable" onClick={() => { if (i === 0) goToOffersFiltered("pending_signature"); else if (i === 1) goToOffersFiltered("sent"); }}><span className="fud-action-icon">{item.icon}</span><span className="fud-action-text">{item.text}</span><span className="fud-action-count" style={{ color: item.color }}>{item.count}</span></div>))}</div></div>
      </div>
      <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\uD83D\uDCCB"} Detailed View</h2><button className="fud-refresh-btn">{"\uD83D\uDDA8\uFE0F"} Print</button></div>
        <div className="fud-table-scroll"><table className="fud-table"><thead><tr><th>Client</th><th>Contact</th><th>Stage</th><th style={{ textAlign: "right" }}>Members</th><th style={{ textAlign: "right" }}>Value</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{fu.detailedView.length === 0 ? <tr><td colSpan={7} className="fud-table-empty">No pipeline data</td></tr> : fu.detailedView.map((offer) => (<tr key={offer.offer_id} className="fud-tr-clickable" onClick={() => openOffer(offer)}><td className="fud-td-client"><span className="fud-td-client-name">{offer.client_name}</span><span className="fud-td-offer-id">{offer.offer_id}</span></td><td className="fud-td-contact">{offer.contact_name || "-"}</td><td><span className="fud-stage-badge" style={{ background: `${fu.STAGE_COLORS[offer.stage]}30`, color: fu.STAGE_COLORS[offer.stage] }}>{fu.STAGE_LABELS[offer.stage]}</span></td><td style={{ textAlign: "right" }}>{offer.members > 0 ? fmt(offer.members) : "-"}</td><td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{offer.value > 0 ? fmtUsd(offer.value) : "-"}</td><td className="fud-td-note">{offer.last_note || "-"}</td><td><div className="fud-td-actions" onClick={(e) => e.stopPropagation()}><button className="fud-td-action-btn" onClick={() => emailHandoff(offer.client_name)}>{"\uD83D\uDCE7"} Email</button><button className="fud-td-action-btn view" onClick={() => openOffer(offer)}>{"\uD83D\uDCC4"} View</button></div></td></tr>))}</tbody></table></div>
        {fu.detailedView.length > 0 && <div className="fud-table-totals"><div className="fud-total-item"><span className="fud-total-icon">{"\uD83D\uDC65"}</span><span className="fud-total-value">{fmt(fu.totalMembers)}</span><span className="fud-total-label">Members</span></div><div className="fud-total-divider">|</div><div className="fud-total-item"><span className="fud-total-icon">{"\uD83D\uDCB0"}</span><span className="fud-total-value gold">{fmtUsd(fu.totalValue)}</span><span className="fud-total-label">Pipeline Value</span></div></div>}
      </div>
      <div className="fud-grid-2">
        <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\u23F0"} Expiring Contracts</h2><span className="fud-expiring-total">Total at risk: <strong>{fmt(fu.allExpiring.reduce((s, e) => s + e.members, 0))}</strong> members</span></div>
          <div className="fud-expiring-tabs">{[30, 60, 90].map((days) => { const count = fu.allExpiring.filter((e) => e.days_left <= days).length; const members = fu.allExpiring.filter((e) => e.days_left <= days).reduce((s, e) => s + e.members, 0); const colors = { 30: "#e74c3c", 60: "#FF9800", 90: "#f39c12" }; return (<button key={days} className={`fud-expiring-tab ${fu.expiringFilter === days ? "active" : ""}`} onClick={() => fu.setExpiringFilter(days)} style={fu.expiringFilter === days ? { borderColor: colors[days as 30|60|90], color: colors[days as 30|60|90] } : {}}>{days === 30 ? "\uD83D\uDD34" : days === 60 ? "\uD83D\uDFE0" : "\uD83D\uDFE1"} {days} Days<span className="fud-exp-count">{count}</span><span className="fud-exp-members">{"\uD83D\uDC65"} {fmt(members)}</span></button>); })}</div>
          <div className="fud-expiring-list"><table className="fud-table compact"><thead><tr><th>Client</th><th>Contract</th><th>Members</th><th>Expires</th><th>Days</th><th>Action</th></tr></thead><tbody>{fu.expiring.length === 0 ? <tr><td colSpan={6} className="fud-table-empty">No contracts expiring</td></tr> : fu.expiring.map((exp, i) => (<tr key={i}><td className="fud-td-client-name">{exp.client_name}</td><td>{exp.contract_name}</td><td style={{ textAlign: "center" }}>{fmt(exp.members)}</td><td>{new Date(exp.expires).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}</td><td><span className={`fud-days-badge ${exp.days_left <= 30 ? "red" : exp.days_left <= 60 ? "orange" : "yellow"}`}>{exp.days_left}d</span></td><td><div className="fud-td-actions"><button className="fud-td-action-btn" onClick={() => emailHandoff(exp.client_name, exp.days_left <= 30 ? "renewal_urgent" : "renewal_reminder")}>{"\uD83D\uDCE7"} Email</button><button className="fud-td-action-btn renew" onClick={() => setRenewContract(exp)}>Renew</button></div></td></tr>))}</tbody></table></div>
        </div>
        <div className="fud-section"><div className="fud-section-header"><h2 className="fud-section-title">{"\uD83D\uDCDD"} Quick Notes & Activity</h2></div>
          <div className="fud-note-form"><GroupedClientDropdown value={fu.newNoteClient} onChange={fu.setNewNoteClient} groupedClients={fu.groupedClients} placeholder="Select Client..." /><div className="fud-note-input-row"><input className="fud-note-input" placeholder="Quick note..." value={fu.newNoteText} onChange={(e) => fu.setNewNoteText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") fu.addNote(); }} /><button className="fud-note-add-btn" onClick={fu.addNote}>Add</button></div></div>
          <div className="fud-notes-section-title">Recent Activity</div>
          <div className="fud-notes-list">{fu.notes.map((note) => (<div key={note.id} className="fud-note-item"><div className="fud-note-header"><span className="fud-note-client">{note.type === "email" ? "\uD83D\uDCE7" : note.type === "call" ? "\uD83D\uDCDE" : note.type === "meeting" ? "\uD83E\uDD1D" : "\uD83D\uDCDD"}{" "}{note.client}</span><span className="fud-note-date">{new Date(note.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}</span></div><div className="fud-note-text">{note.text}</div></div>))}</div>
        </div>
      </div>
    </div>
  );
}
