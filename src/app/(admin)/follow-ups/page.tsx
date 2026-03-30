"use client";

import { useFollowUpDashboard } from "@/hooks/use-follow-ups";
import "./follow-ups.css";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) => "$" + fmt(n);

export default function FollowUpsPage() {
  const fu = useFollowUpDashboard();

  if (fu.loading) {
    return <div className="fud-page"><div className="fud-loading">Loading Follow-up Dashboard...</div></div>;
  }

  return (
    <div className="fud-page">
      {/* Header */}
      <div className="fud-header">
        <h1 className="fud-title">{"\u{1F4CB}"} Follow Up Dashboard</h1>
        <div className="fud-header-actions">
          <button className="fud-export-btn">{"\u{1F4C4}"} Export PDF</button>
          <button className="fud-export-btn">{"\u{1F4CA}"} Export Excel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="fud-kpis">
        <div className="fud-kpi members">
          <div className="fud-kpi-icon">{"\u{1F465}"}</div>
          <div className="fud-kpi-value">{fmt(fu.totalMembers)}</div>
          <div className="fud-kpi-label">Total Members</div>
          <span className="fud-kpi-trend up">Pipeline</span>
        </div>
        <div className="fud-kpi revenue">
          <div className="fud-kpi-icon">{"\u{1F4B0}"}</div>
          <div className="fud-kpi-value">{fmtUsd(fu.totalValue)}</div>
          <div className="fud-kpi-label">Annual Revenue</div>
          <span className="fud-kpi-trend up">Potential</span>
        </div>
        <div className="fud-kpi pending">
          <div className="fud-kpi-icon">{"\u{1F4DD}"}</div>
          <div className="fud-kpi-value">{fu.pendingOffers}</div>
          <div className="fud-kpi-label">Pending Offers</div>
          <span className="fud-kpi-trend neutral">Active</span>
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
          <h2 className="fud-section-title">{"\u{1F4CA}"} Offers Pipeline</h2>
          <button className="fud-refresh-btn" onClick={() => window.location.reload()}>{"\u{1F504}"} Refresh</button>
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
                      <div key={offer.offer_id} className="fud-pipeline-card">
                        <div className="fud-pipeline-card-client">{offer.client_name}</div>
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
            <h2 className="fud-section-title">{"\u{1F4CA}"} Offers Pipeline</h2>
          </div>
          <div className="fud-pipeline-bars">
            {fu.pipelineBars.map((bar) => (
              <div key={bar.stage} className="fud-bar-row">
                <span className="fud-bar-label">{bar.label}</span>
                <div className="fud-bar-container">
                  <div className="fud-bar-fill" style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}aa)` }} />
                </div>
                <span className="fud-bar-count" style={{ color: bar.color }}>{bar.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\u{1F514}"} Action Required</h2>
          </div>
          <div className="fud-action-list">
            {fu.actionItems.map((item, i) => (
              <div key={i} className="fud-action-item">
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
          <h2 className="fud-section-title">{"\u{1F4CB}"} Detailed View</h2>
          <button className="fud-refresh-btn">{"\u{1F5A8}\uFE0F"} Print</button>
        </div>
        <div className="fud-table-scroll">
          <table className="fud-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Stage</th>
                <th style={{ textAlign: "right" }}>Members</th>
                <th style={{ textAlign: "right" }}>Value</th>
                <th>Last Note</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {fu.detailedView.length === 0 ? (
                <tr><td colSpan={6} className="fud-table-empty">No pipeline data available</td></tr>
              ) : (
                fu.detailedView.map((offer) => (
                  <tr key={offer.offer_id}>
                    <td className="fud-td-client">
                      <span className="fud-td-client-name">{offer.client_name}</span>
                      <span className="fud-td-offer-id">{offer.offer_id}</span>
                    </td>
                    <td>
                      <span className="fud-stage-badge" style={{ background: `${fu.STAGE_COLORS[offer.stage]}30`, color: fu.STAGE_COLORS[offer.stage] }}>
                        {fu.STAGE_LABELS[offer.stage]}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{offer.members > 0 ? fmt(offer.members) : "-"}</td>
                    <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{offer.value > 0 ? fmtUsd(offer.value) : "-"}</td>
                    <td className="fud-td-note">{offer.last_note || "-"}</td>
                    <td>
                      <button className="fud-td-action-btn">Contact</button>
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
              <span className="fud-total-icon">{"\u{1F465}"}</span>
              <span className="fud-total-value">{fmt(fu.totalMembers)}</span>
              <span className="fud-total-label">Members</span>
            </div>
            <div className="fud-total-divider">|</div>
            <div className="fud-total-item">
              <span className="fud-total-icon">{"\u{1F4B0}"}</span>
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
                  {days === 30 ? "\u{1F534}" : days === 60 ? "\u{1F7E0}" : "\u{1F7E1}"} {days} Days
                  <span className="fud-exp-count">{count}</span>
                  <span className="fud-exp-members">{"\u{1F465}"} {fmt(members)}</span>
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
                      <td><button className="fud-td-action-btn">Renew</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Notes & Email */}
        <div className="fud-section">
          <div className="fud-section-header">
            <h2 className="fud-section-title">{"\u{1F4DD}"} Quick Notes & Activity</h2>
          </div>
          {/* Add note */}
          <div className="fud-note-form">
            <select className="fud-note-select" value={fu.newNoteClient} onChange={(e) => fu.setNewNoteClient(e.target.value)}>
              <option value="">Select Client...</option>
              {fu.clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="fud-note-input-row">
              <input className="fud-note-input" placeholder="Quick note..." value={fu.newNoteText} onChange={(e) => fu.setNewNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") fu.addNote(); }} />
              <button className="fud-note-add-btn" onClick={fu.addNote}>Add</button>
            </div>
          </div>
          {/* Notes list */}
          <div className="fud-notes-list">
            {fu.notes.map((note) => (
              <div key={note.id} className="fud-note-item">
                <div className="fud-note-header">
                  <span className="fud-note-client">{note.client}</span>
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
