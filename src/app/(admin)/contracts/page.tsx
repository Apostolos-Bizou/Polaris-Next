"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContracts, type ContractRecord } from "@/hooks/use-contracts";
import "./contracts.css";

export default function ContractsPage() {
  const router = useRouter();
  const {
    loading, error, stats, filteredContracts, activeTab, filters,
    clientOptions, resultSummary,
    setActiveTab, updateFilter, clearFilters, refresh,
    getStatusClass, formatContractDate, getDaysUntilExpiry,
  } = useContracts();

  // ── Detail modal state ───────────────────────────────────────────────
  const [detailContract, setDetailContract] = useState<ContractRecord | null>(null);

  // ── Navigate to client dashboard ─────────────────────────────────────
  const goToClientDashboard = (clientId: string) => {
    // Navigate to dashboard with client pre-selected
    router.push(`/dashboard?client=${clientId}`);
  };

  return (
    <div className="contracts-page">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="con-page-header">
        <div>
          <h1 className="con-page-title">📋 Contract Center</h1>
          <p className="con-page-subtitle">Manage contracts, renewals, and client agreements</p>
        </div>
        <button className="con-refresh-btn" onClick={refresh}>
          🔄 Refresh
        </button>
      </div>

      {/* ── KPI Stats Grid ───────────────────────────────────────── */}
      <div className="con-kpi-grid">
        <div className="con-kpi-card">
          <div className="con-kpi-icon">📊</div>
          <div className="con-kpi-value">{stats.total}</div>
          <div className="con-kpi-label">Total Contracts</div>
        </div>
        <div className="con-kpi-card success">
          <div className="con-kpi-icon">✅</div>
          <div className="con-kpi-value">{stats.active}</div>
          <div className="con-kpi-label">Active</div>
          <div className="con-kpi-trend up">Running</div>
        </div>
        <div className="con-kpi-card info">
          <div className="con-kpi-icon">✍️</div>
          <div className="con-kpi-value">{stats.signed}</div>
          <div className="con-kpi-label">Signed</div>
        </div>
        <div className="con-kpi-card">
          <div className="con-kpi-icon">📤</div>
          <div className="con-kpi-value">{stats.sent}</div>
          <div className="con-kpi-label">Sent</div>
        </div>
        <div className="con-kpi-card">
          <div className="con-kpi-icon">📝</div>
          <div className="con-kpi-value">{stats.draft}</div>
          <div className="con-kpi-label">Draft</div>
        </div>
        <div className="con-kpi-card warning">
          <div className="con-kpi-icon">⚠️</div>
          <div className="con-kpi-value">{stats.expiring_soon}</div>
          <div className="con-kpi-label">Expiring Soon</div>
          <div className="con-kpi-trend down">Action Needed</div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="con-tabs">
        <button
          className={`con-tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => { setActiveTab("list"); clearFilters(); }}
        >
          📋 All Contracts
        </button>
        <button
          className={`con-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          ✅ Active <span className="con-badge">{stats.active}</span>
        </button>
        <button
          className={`con-tab-btn ${activeTab === "expiring" ? "active" : ""}`}
          onClick={() => setActiveTab("expiring")}
        >
          ⚠️ Expiring <span className="con-badge warn">{stats.expiring_soon}</span>
        </button>
        <button
          className="con-tab-btn offers"
          onClick={() => router.push("/offers")}
        >
          📝 Proposals & Offers
        </button>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className="con-filter-bar">
        <div className="con-filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={e => updateFilter("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">✅ Active Contracts</option>
            <option value="signed">✍️ Signed</option>
            <option value="sent">📤 Sent</option>
            <option value="draft">📝 Draft</option>
            <option value="expired">❌ Expired</option>
            <option value="No Contract">🚫 No Contract</option>
          </select>
        </div>

        <div className="con-filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={e => updateFilter("type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="ASA">ASA - Service Agreement</option>
            <option value="NDA">NDA - Non-Disclosure</option>
            <option value="DPA">DPA - Data Protection</option>
          </select>
        </div>

        <div className="con-filter-group">
          <label>Group/Client</label>
          <select
            value={filters.client}
            onChange={e => updateFilter("client", e.target.value)}
          >
            <option value="">All Clients</option>
            {clientOptions.map(c => (
              <option key={c.id} value={`GROUP:${c.id}`}>
                🏢 {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="con-filter-group">
          <label>Entity</label>
          <select
            value={filters.entity}
            onChange={e => updateFilter("entity", e.target.value)}
          >
            <option value="">All Entities</option>
            <option value="parent">🏢 Parents Only</option>
            <option value="subsidiary">└ Subsidiaries Only</option>
          </select>
        </div>

        <div className="con-filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={e => updateFilter("dateRange", e.target.value)}
          >
            <option value="">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
        </div>

        <div className="con-filter-group search">
          <label>Search</label>
          <input
            type="text"
            placeholder="🔍 Search contracts..."
            value={filters.search}
            onChange={e => updateFilter("search", e.target.value)}
          />
        </div>

        <button className="con-clear-btn" onClick={clearFilters}>
          ✖ Clear
        </button>
      </div>

      {/* ── Results Count ────────────────────────────────────────── */}
      <div className="con-results-bar">
        <span className="con-results-text">{resultSummary}</span>
        <button className="con-export-btn" onClick={() => alert("Export coming soon")}>
          📊 Export
        </button>
      </div>

      {/* ── Loading / Error ──────────────────────────────────────── */}
      {loading && (
        <div className="con-loading">
          <div className="con-spinner" />
          <span>Loading contracts...</span>
        </div>
      )}

      {error && !loading && (
        <div className="con-error">
          <span>⚠️ {error}</span>
          <button onClick={refresh}>🔄 Retry</button>
        </div>
      )}

      {/* ── Contracts Table ──────────────────────────────────────── */}
      {!loading && !error && (
        <div className="con-table-wrapper">
          <table className="con-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 155, whiteSpace: "nowrap" }}>ID</th>
                <th>Client</th>
                <th style={{ width: 90 }}>Entity</th>
                <th>Type</th>
                <th>Status</th>
                <th>Version</th>
                <th>Created</th>
                <th>Expiry</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="con-empty">
                    No contracts found matching your filters
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c, idx) => {
                  const isParent = c.client_type === "parent";
                  const isSub = c.client_type === "subsidiary";
                  const needsContract = !c.has_contract;
                  const statusClass = getStatusClass(c.status);
                  const expiryDays = getDaysUntilExpiry(c.expiry_date);
                  const isExpiringSoon = expiryDays !== null && expiryDays > 0 && expiryDays <= 90;

                  return (
                    <tr
                      key={`${c.contract_id}-${c.client_id}`}
                      className={`
                        con-row
                        ${isParent ? "parent-row" : ""}
                        ${isSub ? "sub-row" : ""}
                        ${needsContract ? "no-contract-row" : ""}
                        ${isExpiringSoon ? "expiring-row" : ""}
                      `}
                    >
                      <td className="con-cell-num">{idx + 1}</td>
                      <td className="con-cell-id">{c.contract_id || "-"}</td>
                      <td>
                        <button
                          className={`con-client-link ${isParent ? "parent" : ""} ${isSub ? "sub" : ""}`}
                          onClick={() => goToClientDashboard(c.client_id)}
                          title={`View ${c.client_name} KPIs`}
                        >
                          {isParent && "🏢 "}
                          {isSub && <span className="con-sub-indent">└ </span>}
                          {isParent ? <strong>{c.client_name}</strong> : c.client_name}
                        </button>
                      </td>
                      <td className="con-cell-center">
                        {isParent ? (
                          <span className="con-entity-badge parent">PARENT</span>
                        ) : isSub ? (
                          <span className="con-entity-badge sub">SUB</span>
                        ) : (
                          <span className="con-entity-badge">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`con-type-badge ${(c.doc_type || "").toLowerCase()}`}>
                          {c.doc_type || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`con-status ${statusClass}`}>
                          {c.status || "-"}
                        </span>
                        {isExpiringSoon && (
                          <span className="con-expiry-warn" title={`Expires in ${expiryDays} days`}>
                            ⚠️ {expiryDays}d
                          </span>
                        )}
                      </td>
                      <td className="con-cell-center">
                        {needsContract || !c.version || c.version === "-" ? "-" : `v${c.version}`}
                      </td>
                      <td>{formatContractDate(c.effective_date)}</td>
                      <td className={isExpiringSoon ? "con-expiry-cell" : ""}>
                        {formatContractDate(c.expiry_date)}
                      </td>
                      <td className="con-actions">
                        {needsContract ? (
                          <button
                            className="con-action-btn create"
                            onClick={() => router.push(`/offers?client=${c.client_id}`)}
                          >
                            + Create
                          </button>
                        ) : (
                          <>
                            <button
                              className="con-action-btn view"
                              onClick={() => setDetailContract(c)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            {c.current_doc_url && (
                              <a
                                href={c.current_doc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="con-action-btn doc"
                                title="Open Document"
                              >
                                📄
                              </a>
                            )}
                            {c.gdrive_folder_url && (
                              <a
                                href={c.gdrive_folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="con-action-btn folder"
                                title="Open Folder"
                              >
                                📁
                              </a>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Contract Detail Modal ────────────────────────────────── */}
      {detailContract && (
        <div className="con-modal-overlay" onClick={() => setDetailContract(null)}>
          <div className="con-modal" onClick={e => e.stopPropagation()}>
            <div className="con-modal-header">
              <h2>
                <span className="con-modal-icon">📋</span>
                {detailContract.doc_type || "Contract"} — {detailContract.client_name}
              </h2>
              <button className="con-modal-close" onClick={() => setDetailContract(null)}>
                ✕
              </button>
            </div>

            <div className="con-modal-body">
              <div className="con-detail-grid">
                {/* ── Contract Info ────────────── */}
                <div className="con-detail-section">
                  <h4>📋 Contract Information</h4>
                  <div className="con-detail-row">
                    <span>Contract ID</span>
                    <span>{detailContract.contract_id}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Type</span>
                    <span className={`con-type-badge ${(detailContract.doc_type || "").toLowerCase()}`}>
                      {detailContract.doc_type || "-"}
                    </span>
                  </div>
                  <div className="con-detail-row">
                    <span>Status</span>
                    <span className={`con-status ${getStatusClass(detailContract.status)}`}>
                      {detailContract.status}
                    </span>
                  </div>
                  <div className="con-detail-row">
                    <span>Version</span>
                    <span>v{detailContract.version || 1}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Entity Type</span>
                    <span>
                      {detailContract.client_type === "parent" ? "🏢 Parent" :
                       detailContract.client_type === "subsidiary" ? "└ Subsidiary" : "-"}
                    </span>
                  </div>
                </div>

                {/* ── Dates ───────────────────── */}
                <div className="con-detail-section">
                  <h4>📅 Key Dates</h4>
                  <div className="con-detail-row">
                    <span>Effective Date</span>
                    <span>{formatContractDate(detailContract.effective_date)}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Expiry Date</span>
                    <span>{formatContractDate(detailContract.expiry_date)}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Signed Date</span>
                    <span>{formatContractDate(detailContract.signed_date)}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Auto Renewal</span>
                    <span>{detailContract.auto_renewal ? "✅ Yes" : "❌ No"}</span>
                  </div>
                  {(() => {
                    const days = getDaysUntilExpiry(detailContract.expiry_date);
                    if (days !== null && days > 0) {
                      return (
                        <div className="con-detail-row">
                          <span>Days Until Expiry</span>
                          <span className={days <= 90 ? "con-expiry-warn-text" : ""}>
                            {days} days {days <= 90 ? "⚠️" : ""}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* ── Contact Info ─────────────── */}
                <div className="con-detail-section">
                  <h4>👤 Contact</h4>
                  <div className="con-detail-row">
                    <span>Contact Name</span>
                    <span>{detailContract.contact_name || "-"}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Email</span>
                    <span>{detailContract.contact_email || "-"}</span>
                  </div>
                  <div className="con-detail-row">
                    <span>Members</span>
                    <span>{(detailContract.total_members || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Financials (if available) ── */}
                {detailContract.financials && (
                  <div className="con-detail-section">
                    <h4>💰 Financials</h4>
                    <div className="con-fin-grid">
                      <div>
                        <span className="con-fin-label">🥇 Gold</span>
                        <strong>{detailContract.financials.plan_gold_members || 0}</strong>
                      </div>
                      <div>
                        <span className="con-fin-label">🥈 Platinum</span>
                        <strong>{detailContract.financials.plan_platinum_members || 0}</strong>
                      </div>
                      <div>
                        <span className="con-fin-label">💎 Diamond</span>
                        <strong>{detailContract.financials.plan_diamond_members || 0}</strong>
                      </div>
                      <div>
                        <span className="con-fin-label">Fund</span>
                        <strong>${(detailContract.financials.fund_amount || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="con-fin-label">Annual Cost</span>
                        <strong>${(detailContract.financials.running_cost_annual || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="con-fin-label">Dental</span>
                        <strong>{detailContract.financials.has_dental === "TRUE" ? "✅ Yes" : "❌ No"}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── History ────────────────────── */}
              {detailContract.history && detailContract.history.length > 0 && (
                <div className="con-detail-section" style={{ marginTop: "1.5rem" }}>
                  <h4>📜 History</h4>
                  {detailContract.history.map((h, i) => (
                    <div key={i} className="con-history-item">
                      <div className="con-history-dot" />
                      <div className="con-history-content">
                        <div className="con-history-action">{h.action}</div>
                        <div className="con-history-notes">{h.notes}</div>
                      </div>
                      <div className="con-history-date">{formatContractDate(h.action_date)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Action Buttons ─────────────── */}
              <div className="con-modal-actions">
                <button
                  className="con-modal-btn primary"
                  onClick={() => goToClientDashboard(detailContract.client_id)}
                >
                  📊 View Full KPIs
                </button>
                {detailContract.gdrive_folder_url && (
                  <a
                    href={detailContract.gdrive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="con-modal-btn secondary"
                  >
                    📁 Open Folder
                  </a>
                )}
                {detailContract.current_doc_url && (
                  <a
                    href={detailContract.current_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="con-modal-btn secondary"
                  >
                    📄 Open Document
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
