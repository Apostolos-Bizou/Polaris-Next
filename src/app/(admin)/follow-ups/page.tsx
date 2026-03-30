"use client";

import { useState, useRef, useEffect } from "react";
import { useFollowUpDashboard } from "@/hooks/use-follow-ups";
import type { GroupedClient } from "@/hooks/use-follow-ups";
import "./follow-ups.css";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) => "$" + fmt(n);

/* ---- Navigate to Offers and open specific offer ---- */
function goToOffer(offerId: string) {
  localStorage.setItem("polaris_open_offer", JSON.stringify({
    offerId,
    timestamp: Date.now(),
  }));
  window.location.href = "/offers?openOffer=" + encodeURIComponent(offerId);
}

/* ---- Navigate to Offers with status filter ---- */
function goToOffersFiltered(status: string) {
  window.location.href = "/offers?filterStatus=" + encodeURIComponent(status);
}

/* ---- Handoff to Email Center ---- */
function emailHandoff(clientName: string, template?: string) {
  const handoff = {
    type: "followUpEmail",
    clientName,
    template: template || "",
    source: "follow-ups",
    timestamp: Date.now(),
  };
  localStorage.setItem("polaris_followup_email", JSON.stringify(handoff));
  window.location.href = "/email?followUpEmail=true";
}

/* ---- Grouped Client Dropdown Component ---- */
function GroupedClientDropdown({
  value,
  onChange,
  groupedClients,
  placeholder = "Select Client...",
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  groupedClients: GroupedClient[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = groupedClients
    .map((g) => {
      const term = search.toLowerCase();
      const parentMatch = g.parent.name.toLowerCase().includes(term);
      const matchedSubs = g.subsidiaries.filter((s) => s.name.toLowerCase().includes(term));
      if (!parentMatch && matchedSubs.length === 0) return null;
      return { ...g, subsidiaries: parentMatch ? g.subsidiaries : matchedSubs };
    })
    .filter(Boolean) as GroupedClient[];

  return (
    <div ref={ref} className={`gcd-wrapper ${className}`}>
      <button type="button" className={`gcd-trigger ${open ? "open" : ""} ${value ? "has-value" : ""}`} onClick={() => setOpen(!open)}>
        <span className="gcd-trigger-text">{value || placeholder}</span>
        <span className="gcd-chevron">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div className="gcd-dropdown">
          <div className="gcd-search-wrap">
            <input className="gcd-search" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="gcd-list">
            {filtered.length === 0 && <div className="gcd-empty">No clients found</div>}
            {filtered.map((g) => (
              <div key={g.parent.id} className="gcd-group">
                <div className={`gcd-parent ${value === g.parent.name ? "selected" : ""}`} onClick={() => { onChange(g.parent.name); setOpen(false); setSearch(""); }}>
                  <span className="gcd-parent-icon">{"\uD83C\uDFE2"}</span>
                  <span className="gcd-parent-name">{g.parent.name}</span>
                  {g.subsidiaries.length > 0 && <span className="gcd-sub-count">{g.subsidiaries.length}</span>}
                </div>
                {g.subsidiaries.map((sub) => (
                  <div key={sub.id} className={`gcd-sub ${value === sub.name ? "selected" : ""}`} onClick={() => { onChange(sub.name); setOpen(false); setSearch(""); }}>
                    <span className="gcd-sub-indent">{"\u2514"}</span>
                    <span className="gcd-sub-name">{sub.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FollowUpsPage() {
  const fu = useFollowUpDashboard();

  if (fu.loading) {
    return <div className="fud-page"><div className="fud-loading">Loading Follow-up Dashboard...</div></div>;
  }

  return (
    <div className="fud-page">
      {/* Header */}
      <div className="fud-header">
        <h1 className="fud-title">{"\uD83D\uDCCB"} Follow Up Dashboard</h1>
        <div className="fud-header-actions">
          <button className="fud-export-btn">{"\uD83D\uDCC4"} Export PDF</button>
          <button className="fud-export-btn">{"\uD83D\uDCCA"} Export Excel</button>
        </div>
      </div>

      {/* KPI Cards - clickable */}
      <div className="fud-kpis">
        <div className="fud-kpi members clickable" onClick={() => goToOffersFiltered("all")}>
          <div className="fud-kpi-icon">{"\uD83D\uDC65"}</div>
          <div className="fud-kpi-value">{fmt(fu.totalMembers)}</div>
          <div className="fud-kpi-label">Total Members</div>
          <span className="fud-kpi-trend up">Pipeline</span>
        </div>
        <div className="fud-kpi revenue clickable" onClick={() => goToOffersFiltered("all")}>
          <div className="fud-kpi-icon">{"\uD83D\uDCB0"}</div>
          <div className="fud-kpi-value">{fmtUsd(fu.totalValue)}</div>
          <div className="fud-kpi-label">Pipeline Value</div>
          <span className="fud-kpi-trend up">Total</span>
        </div>
        <div className="fud-kpi pending clickable" onClick={() => goToOffersFiltered("sent")}>
          <div className="fud-kpi-icon">{"\uD83D\uDCDD"}</div>
          <div className="fud-kpi-value">{fu.pendingOffers}</div>
          <div className="fud-kpi-label">In Progress</div>
          <span className="fud-kpi-trend neutral">Sent/Pending/Accepted</span>
        </div>
        <div className="fud-kpi expiring">
          <div className="fud-kpi-icon">{"\u26A0\uFE0F"}</div>
          <div className="fud-kpi-value">{fu.expiringCount}</div>
          <div className="fud-kpi-label">Expiring (90 days)</div>
          <span className="fud-kpi-trend down">Action Required</span>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="fud-section">
        <div className="fud-section-header">
          <h2 className="fud-section-title">{"\uD83D\uDCCA"} Offers Pipeline</h2>
          <button className="fud-refresh-btn" onClick={() => window.location.reload()}>{"\uD83D\uDD04"} Refresh</button>
        </div>
        <div className="fud-pipeline-scroll">
          <div className="fud-pipeline-kanban">
            {fu.STAGE_ORDER.map((stage) => (
              <div key={stage} className={`fud-pipeline-col ${stage}`}>
                <div className="fud-pipeline-col-header" style={{ background: `${fu.STAGE_COLORS[stage]}40`, color: fu.STAGE_COLORS[stage] }}>
                  {fu.STAGE_LABELS[stage]} <span className="fud-pipeline-count">{fu.pipelineByStage[stage].length}</span>
                </div>
                <div className="fud-pipeline-col-body">
                  {fu.pipelineByStage[stage].length === 0 ? (
                    <div className="fud-pipeline-empty">No offers</div>
                  ) : (
                    fu.pipelineByStage[stage].map((offer) => (
                      <div key={offer.offer_id} className="fud-pipeline-card" onClick={() => goToOffer(offer.offer_id, offer)}>
                        <div className="fud-pipeline-card-top">
                          <div className="fud-pipeline-card-client">{offer.client_name}</div>
                          <button
                            className="fud-card-email-btn"
                            title="Send Email"
                            onClick={(e) => { e.stopPropagation(); emailHandoff(offer.client_name); }}
                          >{"\uD83D\uDCE7"}</button>
                        </div>
                        <div className="fud-pipeline-card-value">{fmtUsd(offer.value)}</div>
                        {offer.members > 0 && <div className="fud-pipeline-card-members">{fmt(offer.members)} members</div>}
                        <div className="fud-pipeline-card-id">{offer.offer_id}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Bars + Action Required (side by side) */}
      <div className="fud-grid-2">
        {/* Pipeline Bar Chart */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\uD83D\uDCCA"} Offers Pipeline</h2>
          </div>
          <div className="fud-pipeline-bars">
            {fu.pipelineBars.map((bar) => (
              <div key={bar.stage} className="fud-bar-row clickable" onClick={() => goToOffersFiltered(bar.stage)}>
                <span className="fud-bar-label">{bar.label}</span>
                <div className="fud-bar-container">
                  <div className="fud-bar-fill" style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}aa)` }} />
                </div>
                <span className="fud-bar-count" style={{ color: bar.color }}>{bar.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required - clickable items */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\uD83D\uDD14"} Action Required</h2>
          </div>
          <div className="fud-action-list">
            {fu.actionItems.map((item, i) => (
              <div key={i} className="fud-action-item clickable" onClick={() => {
                if (i === 0) goToOffersFiltered("pending_signature");
                else if (i === 1) goToOffersFiltered("sent");
                // items 2,3 are expiring - scroll down or just stay
              }}>
                <span className="fud-action-icon">{item.icon}</span>
                <span className="fud-action-text">{item.text}</span>
                <span className="fud-action-count" style={{ color: item.color }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed View Table */}
      <div className="fud-section">
        <div className="fud-section-header">
          <h2 className="fud-section-title">{"\uD83D\uDCCB"} Detailed View</h2>
          <button className="fud-refresh-btn">{"\uD83D\uDDA8\uFE0F"} Print</button>
        </div>
        <div className="fud-table-scroll">
          <table className="fud-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Stage</th>
                <th style={{ textAlign: "right" }}>Members</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fu.detailedView.length === 0 ? (
                <tr><td colSpan={7} className="fud-table-empty">No pipeline data available</td></tr>
              ) : (
                fu.detailedView.map((offer) => (
                  <tr key={offer.offer_id} className="fud-tr-clickable" onClick={() => goToOffer(offer.offer_id, offer)}>
                    <td className="fud-td-client">
                      <span className="fud-td-client-name">{offer.client_name}</span>
                      <span className="fud-td-offer-id">{offer.offer_id}</span>
                    </td>
                    <td className="fud-td-contact">{offer.contact_name || "-"}</td>
                    <td>
                      <span className="fud-stage-badge" style={{ background: `${fu.STAGE_COLORS[offer.stage]}30`, color: fu.STAGE_COLORS[offer.stage] }}>
                        {fu.STAGE_LABELS[offer.stage]}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{offer.members > 0 ? fmt(offer.members) : "-"}</td>
                    <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{offer.value > 0 ? fmtUsd(offer.value) : "-"}</td>
                    <td className="fud-td-note">{offer.last_note || "-"}</td>
                    <td>
                      <div className="fud-td-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="fud-td-action-btn" onClick={() => emailHandoff(offer.client_name)}>{"\uD83D\uDCE7"} Email</button>
                        <button className="fud-td-action-btn view" onClick={() => goToOffer(offer.offer_id, offer)}>{"\uD83D\uDCC4"} View</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {fu.detailedView.length > 0 && (
          <div className="fud-table-totals">
            <div className="fud-total-item">
              <span className="fud-total-icon">{"\uD83D\uDC65"}</span>
              <span className="fud-total-value">{fmt(fu.totalMembers)}</span>
              <span className="fud-total-label">Members</span>
            </div>
            <div className="fud-total-divider">|</div>
            <div className="fud-total-item">
              <span className="fud-total-icon">{"\uD83D\uDCB0"}</span>
              <span className="fud-total-value gold">{fmtUsd(fu.totalValue)}</span>
              <span className="fud-total-label">Pipeline Value</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Expiring + Quick Notes */}
      <div className="fud-grid-2">
        {/* Expiring Contracts */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\u23F0"} Expiring Contracts</h2>
            <span className="fud-expiring-total">
              Total at risk: <strong>{fmt(fu.allExpiring.reduce((s, e) => s + e.members, 0))}</strong> members
            </span>
          </div>
          <div className="fud-expiring-tabs">
            {[30, 60, 90].map((days) => {
              const count = fu.allExpiring.filter((e) => e.days_left <= days).length;
              const members = fu.allExpiring.filter((e) => e.days_left <= days).reduce((s, e) => s + e.members, 0);
              const colors = { 30: "#e74c3c", 60: "#FF9800", 90: "#f39c12" };
              return (
                <button
                  key={days}
                  className={`fud-expiring-tab ${fu.expiringFilter === days ? "active" : ""}`}
                  onClick={() => fu.setExpiringFilter(days)}
                  style={fu.expiringFilter === days ? { borderColor: colors[days as 30|60|90], color: colors[days as 30|60|90] } : {}}
                >
                  {days === 30 ? "\uD83D\uDD34" : days === 60 ? "\uD83D\uDFE0" : "\uD83D\uDFE1"} {days} Days
                  <span className="fud-exp-count">{count}</span>
                  <span className="fud-exp-members">{"\uD83D\uDC65"} {fmt(members)}</span>
                </button>
              );
            })}
          </div>
          <div className="fud-expiring-list">
            <table className="fud-table compact">
              <thead>
                <tr><th>Client</th><th>Contract</th><th>Members</th><th>Expires</th><th>Days</th><th>Action</th></tr>
              </thead>
              <tbody>
                {fu.expiring.length === 0 ? (
                  <tr><td colSpan={6} className="fud-table-empty">No contracts expiring in this period</td></tr>
                ) : (
                  fu.expiring.map((exp, i) => (
                    <tr key={i}>
                      <td className="fud-td-client-name">{exp.client_name}</td>
                      <td>{exp.contract_name}</td>
                      <td style={{ textAlign: "center" }}>{fmt(exp.members)}</td>
                      <td>{new Date(exp.expires).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}</td>
                      <td>
                        <span className={`fud-days-badge ${exp.days_left <= 30 ? "red" : exp.days_left <= 60 ? "orange" : "yellow"}`}>
                          {exp.days_left}d
                        </span>
                      </td>
                      <td>
                        <div className="fud-td-actions">
                          <button className="fud-td-action-btn" onClick={() => emailHandoff(exp.client_name, exp.days_left <= 30 ? "renewal_urgent" : "renewal_reminder")}>
                            {"\uD83D\uDCE7"} Email
                          </button>
                          <button className="fud-td-action-btn renew">Renew</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Notes */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\uD83D\uDCDD"} Quick Notes & Activity</h2>
          </div>
          <div className="fud-note-form">
            <GroupedClientDropdown
              value={fu.newNoteClient}
              onChange={fu.setNewNoteClient}
              groupedClients={fu.groupedClients}
              placeholder="Select Client..."
            />
            <div className="fud-note-input-row">
              <input className="fud-note-input" placeholder="Quick note..." value={fu.newNoteText} onChange={(e) => fu.setNewNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fu.addNote(); }} />
              <button className="fud-note-add-btn" onClick={fu.addNote}>Add</button>
            </div>
          </div>
          <div className="fud-notes-section-title">Recent Activity</div>
          <div className="fud-notes-list">
            {fu.notes.map((note) => (
              <div key={note.id} className="fud-note-item">
                <div className="fud-note-header">
                  <span className="fud-note-client">
                    {note.type === "email" ? "\uD83D\uDCE7" : note.type === "call" ? "\uD83D\uDCDE" : note.type === "meeting" ? "\uD83E\uDD1D" : "\uD83D\uDCDD"}{" "}
                    {note.client}
                  </span>
                  <span className="fud-note-date">{new Date(note.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}</span>
                </div>
                <div className="fud-note-text">{note.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
