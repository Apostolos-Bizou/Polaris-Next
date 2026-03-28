"use client";

import { useParams, useRouter } from "next/navigation";
import { useClientFolder } from "@/hooks/use-client-folder";
import "./client-folder.css";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) => "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null | undefined) => {
  if (!d) return "--";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "--"; }
};

export default function ClientFolderPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const {
    loading, error, client, kpis, financials, categories,
    providers, contracts, subsidiaries, initials, daysUntilExpiry,
    refresh,
  } = useClientFolder(clientId);

  if (loading) {
    return (
      <div className="cf-loading">
        <div className="cf-spinner" />
        <span>Loading client portfolio...</span>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="cf-error">
        <span>⚠️ {error || "Client not found"}</span>
        <button onClick={() => router.back()}>← Go Back</button>
      </div>
    );
  }

  const isParent = client.client_type === "parent";

  return (
    <div className="cf-page">
      {/* ── Back Button ──────────────────────────────────────── */}
      <button className="cf-back" onClick={() => router.back()}>
        ← Back
      </button>

      {/* ── Client Header ────────────────────────────────────── */}
      <div className="cf-header">
        <div className="cf-header-info">
          <div className="cf-avatar">{initials}</div>
          <div className="cf-header-details">
            <h1 className="cf-name">
              {client.client_name} <span>Portfolio</span>
            </h1>
            <div className="cf-meta">
              <span>📅 Contract: <strong>{fmtDate(client.contract_start)}</strong> — <strong>{fmtDate(client.contract_end)}</strong></span>
              <span>👥 Members: <strong>{fmt(client.total_members)}</strong></span>
              {contracts.length > 0 && <span>📄 Contracts: <strong>{contracts.length}</strong></span>}
              {isParent && subsidiaries.length > 0 && (
                <span>🏷️ Subsidiaries: <strong>{subsidiaries.length}</strong></span>
              )}
              {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 90 && (
                <span className="cf-expiry-warn">⚠️ Expires in {daysUntilExpiry} days</span>
              )}
            </div>
          </div>
        </div>
        <div className="cf-header-actions">
          <button className="cf-btn secondary" onClick={() => alert("Google Drive - coming soon")}>📁 Google Drive</button>
          <button className="cf-btn secondary" onClick={() => alert("Email - coming soon")}>📧 Email</button>
          <button className="cf-btn secondary gold" onClick={() => alert("Add Contact - coming soon")}>👥 Add Contact</button>
          <button className="cf-btn primary" onClick={() => router.push(`/dashboard?client=${clientId}`)}>📊 Full KPIs</button>
        </div>
      </div>

      {/* ── Quick Stats ──────────────────────────────────────── */}
      {kpis && (
        <div className="cf-quick-stats">
          <div className="cf-stat">
            <div className="cf-stat-icon">👥</div>
            <div className="cf-stat-value">{fmt(kpis.total_members)}</div>
            <div className="cf-stat-label">Total Members</div>
          </div>
          <div className="cf-stat">
            <div className="cf-stat-icon">📋</div>
            <div className="cf-stat-value">{fmt(kpis.total_claims)}</div>
            <div className="cf-stat-label">Total Claims</div>
          </div>
          <div className="cf-stat">
            <div className="cf-stat-icon">💰</div>
            <div className="cf-stat-value">{fmtUsd(kpis.approved_amount)}</div>
            <div className="cf-stat-label">Approved Amount</div>
          </div>
          <div className="cf-stat">
            <div className="cf-stat-icon">📊</div>
            <div className="cf-stat-value">{kpis.utilization}%</div>
            <div className="cf-stat-label">Utilization</div>
          </div>
          <div className="cf-stat">
            <div className="cf-stat-icon">💵</div>
            <div className="cf-stat-value">{fmtUsd(kpis.cost_per_member)}</div>
            <div className="cf-stat-label">Cost/Member</div>
          </div>
        </div>
      )}

      {/* ── Analytics Grid ───────────────────────────────────── */}
      <div className="cf-analytics-grid">

        {/* ── Inpatient vs Outpatient ─────────────────────────── */}
        {kpis && (
          <div className="cf-section">
            <div className="cf-section-header">🏥 Inpatient vs Outpatient</div>
            <div className="cf-bars">
              <div className="cf-bar-row">
                <span className="cf-bar-label">Inpatient</span>
                <div className="cf-bar-track">
                  <div
                    className="cf-bar-fill inpatient"
                    style={{ width: `${(kpis.inpatient_claims / kpis.total_claims * 100)}%` }}
                  />
                </div>
                <span className="cf-bar-value">{fmt(kpis.inpatient_claims)} ({fmtUsd(kpis.inpatient_cost)})</span>
              </div>
              <div className="cf-bar-row">
                <span className="cf-bar-label">Outpatient</span>
                <div className="cf-bar-track">
                  <div
                    className="cf-bar-fill outpatient"
                    style={{ width: `${(kpis.outpatient_claims / kpis.total_claims * 100)}%` }}
                  />
                </div>
                <span className="cf-bar-value">{fmt(kpis.outpatient_claims)} ({fmtUsd(kpis.outpatient_cost)})</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Principal vs Dependent ──────────────────────────── */}
        {kpis && (
          <div className="cf-section">
            <div className="cf-section-header">👤 Principal vs Dependent</div>
            <div className="cf-bars">
              <div className="cf-bar-row">
                <span className="cf-bar-label">Principal</span>
                <div className="cf-bar-track">
                  <div
                    className="cf-bar-fill principal"
                    style={{ width: `${(kpis.principal_members / kpis.total_members * 100)}%` }}
                  />
                </div>
                <span className="cf-bar-value">{fmt(kpis.principal_members)} ({Math.round(kpis.principal_members / kpis.total_members * 100)}%)</span>
              </div>
              <div className="cf-bar-row">
                <span className="cf-bar-label">Dependent</span>
                <div className="cf-bar-track">
                  <div
                    className="cf-bar-fill dependent"
                    style={{ width: `${(kpis.dependent_members / kpis.total_members * 100)}%` }}
                  />
                </div>
                <span className="cf-bar-value">{fmt(kpis.dependent_members)} ({Math.round(kpis.dependent_members / kpis.total_members * 100)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Financial Breakdown ─────────────────────────────── */}
        {financials && (
          <div className="cf-section">
            <div className="cf-section-header">💰 Financial Breakdown</div>
            <div className="cf-fin-grid">
              <div className="cf-fin-item green">
                <div className="cf-fin-value">{fmtUsd(financials.revenue)}</div>
                <div className="cf-fin-label">Total Premium</div>
              </div>
              <div className="cf-fin-item blue">
                <div className="cf-fin-value">{fmtUsd(financials.claims_paid)}</div>
                <div className="cf-fin-label">Total Claims</div>
              </div>
              <div className="cf-fin-item orange">
                <div className="cf-fin-value">{fmtUsd(Math.round(financials.revenue * 0.08))}</div>
                <div className="cf-fin-label">Admin Fees</div>
              </div>
              <div className="cf-fin-item red">
                <div className="cf-fin-value">{kpis?.loss_ratio}%</div>
                <div className="cf-fin-label">Loss Ratio</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Claims by Category ──────────────────────────────── */}
        <div className="cf-section">
          <div className="cf-section-header">📋 Claims by Category</div>
          <div className="cf-category-grid">
            {categories.map(cat => (
              <div key={cat.category} className="cf-cat-item">
                <div className="cf-cat-value">{fmt(cat.claims)}</div>
                <div className="cf-cat-label">{cat.category}</div>
                <div className="cf-cat-cost">{fmtUsd(cat.cost)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Hospitals ──────────────────────────────────── */}
        <div className="cf-section">
          <div className="cf-section-header">🏥 Top Hospitals & Providers</div>
          <div className="cf-provider-list">
            {providers.map((p, i) => (
              <div key={i} className="cf-provider-row">
                <span className="cf-provider-rank">#{i + 1}</span>
                <div className="cf-provider-info">
                  <span className="cf-provider-name">{p.name}</span>
                  <span className="cf-provider-country">{p.country}</span>
                </div>
                <span className="cf-provider-claims">{fmt(p.claims)} claims</span>
                <span className="cf-provider-cost">{fmtUsd(p.cost)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fees & Charges ─────────────────────────────────── */}
        {financials && (
          <div className="cf-section">
            <div className="cf-section-header">💳 Fees & Charges</div>
            <div className="cf-fees">
              <div className="cf-fee-row">
                <span>Admin Fee</span>
                <span style={{ color: "#3498db" }}>{fmtUsd(Math.round(financials.revenue * 0.08))}</span>
              </div>
              <div className="cf-fee-row">
                <span>Claims Processing</span>
                <span style={{ color: "#27ae60" }}>{fmtUsd(Math.round(financials.revenue * 0.03))}</span>
              </div>
              <div className="cf-fee-row">
                <span>Stop-Loss Premium</span>
                <span style={{ color: "#9b59b6" }}>{fmtUsd(Math.round(financials.revenue * 0.05))}</span>
              </div>
              <div className="cf-fee-row total">
                <span>Total Charges</span>
                <span style={{ color: "#D4AF37" }}>{fmtUsd(Math.round(financials.revenue * 0.16))}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Client Financial KPIs (Cyprus Tax View) ────────── */}
        {financials && (
          <div className="cf-section full-width cf-cyprus">
            <div className="cf-section-header">
              <span>🇨🇾 Client Financial KPIs</span>
              <span className="cf-cyprus-badge">Cyprus Tax View</span>
            </div>
            <div className="cf-cyprus-kpis">
              <div className="cf-cyprus-card blue-border">
                <div className="cf-cyprus-icon">💵</div>
                <div className="cf-cyprus-value blue">{fmtUsd(financials.revenue)}</div>
                <div className="cf-cyprus-label">Revenue from Client</div>
              </div>
              <div className="cf-cyprus-card red-border">
                <div className="cf-cyprus-icon">📤</div>
                <div className="cf-cyprus-value red">{fmtUsd(financials.claims_paid)}</div>
                <div className="cf-cyprus-label">Claims Paid</div>
              </div>
              <div className="cf-cyprus-card green-border">
                <div className="cf-cyprus-icon">📈</div>
                <div className="cf-cyprus-value green">{fmtUsd(financials.net_profit)}</div>
                <div className="cf-cyprus-label">Net Profit</div>
              </div>
              <div className="cf-cyprus-card gold-border">
                <div className="cf-cyprus-icon">🏛️</div>
                <div className="cf-cyprus-value gold">{fmtUsd(financials.tax_contribution)}</div>
                <div className="cf-cyprus-label">Tax Contribution</div>
              </div>
            </div>
            <div className="cf-cyprus-ratios">
              <div>
                <div className="cf-ratio-value green">{kpis?.loss_ratio}%</div>
                <div className="cf-ratio-label">Loss Ratio</div>
                <div className="cf-ratio-target">Target: &lt;70%</div>
              </div>
              <div>
                <div className="cf-ratio-value gold">{financials.gross_margin}%</div>
                <div className="cf-ratio-label">Gross Margin</div>
                <div className="cf-ratio-target">Target: &gt;30%</div>
              </div>
              <div>
                <div className="cf-ratio-value blue">{fmtUsd(financials.arpm)}</div>
                <div className="cf-ratio-label">ARPM</div>
                <div className="cf-ratio-target">Avg Rev/Member</div>
              </div>
              <div>
                <div className="cf-ratio-value purple">{fmtUsd(financials.cpm)}</div>
                <div className="cf-ratio-label">CPM</div>
                <div className="cf-ratio-target">Cost/Member</div>
              </div>
              <div>
                <div className="cf-ratio-value orange">{financials.revenue_share}%</div>
                <div className="cf-ratio-label">Revenue Share</div>
                <div className="cf-ratio-target">% of Total</div>
              </div>
            </div>

            {/* CFO Assessment */}
            <div className="cf-cfo-note">
              <div className="cf-cfo-title">💡 CFO Assessment</div>
              <div className="cf-cfo-text">
                {financials.gross_margin > 30
                  ? `${client.client_name} is performing well with a ${financials.gross_margin}% gross margin and ${kpis?.loss_ratio}% loss ratio. Revenue contribution of ${financials.revenue_share}% with ${fmt(kpis?.total_members || 0)} active members. Recommend maintaining current terms at renewal.`
                  : `${client.client_name} shows a ${financials.gross_margin}% gross margin which is below target. Loss ratio at ${kpis?.loss_ratio}% needs monitoring. Consider premium adjustment or benefit restructuring at next renewal.`
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Subsidiaries (if parent) ───────────────────────── */}
        {isParent && subsidiaries.length > 0 && (
          <div className="cf-section full-width">
            <div className="cf-section-header">🏷️ Subsidiaries</div>
            <div className="cf-subs-grid">
              {subsidiaries.map(sub => (
                <button
                  key={sub.client_id}
                  className="cf-sub-card"
                  onClick={() => router.push(`/clients/${sub.client_id}`)}
                >
                  <div className="cf-sub-name">{sub.client_name}</div>
                  <div className="cf-sub-members">👥 {fmt(sub.total_members)} members</div>
                  <div className="cf-sub-plan">{sub.plan_type}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Contracts ──────────────────────────────────────── */}
        <div className="cf-section full-width">
          <div className="cf-section-header">📋 Contracts</div>
          {contracts.length === 0 ? (
            <div className="cf-empty">No contracts found</div>
          ) : (
            <div className="cf-contracts-list">
              {contracts.map(c => (
                <div key={c.contract_id} className="cf-contract-row">
                  <span className="cf-contract-id">{c.contract_id}</span>
                  <span className="cf-contract-type">{c.doc_type}</span>
                  <span className={`cf-contract-status ${c.status.toLowerCase()}`}>{c.status}</span>
                  <span>v{c.version}</span>
                  <span>{fmtDate(c.effective_date)} — {fmtDate(c.expiry_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Contact Information ─────────────────────────────── */}
        {client.contact_name && (
          <div className="cf-section">
            <div className="cf-section-header">📞 Contact Information</div>
            <div className="cf-contact">
              <div className="cf-contact-row">
                <span>Name</span>
                <strong>{client.contact_name}</strong>
              </div>
              <div className="cf-contact-row">
                <span>Email</span>
                <strong>{client.contact_email}</strong>
              </div>
              <div className="cf-contact-row">
                <span>Country</span>
                <strong>{client.country}</strong>
              </div>
              <div className="cf-contact-row">
                <span>Plans</span>
                <strong>{client.plan_type}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── Report Summary ─────────────────────────────────── */}
        <div className="cf-section">
          <div className="cf-section-header">📋 Report Summary</div>
          <div className="cf-report-grid">
            <div className="cf-report-card">
              <div className="cf-report-icon">⭐</div>
              <div className="cf-report-title">Client Status</div>
              <div className="cf-report-value">{client.status === "active" ? "✅ Active" : client.status}</div>
              <div className="cf-report-note">Since {fmtDate(client.contract_start)}</div>
            </div>
            <div className="cf-report-card">
              <div className="cf-report-icon">📈</div>
              <div className="cf-report-title">Growth Trend</div>
              <div className="cf-report-value">↑ Stable</div>
              <div className="cf-report-note">+2.3% vs last year</div>
            </div>
            <div className="cf-report-card">
              <div className="cf-report-icon">💰</div>
              <div className="cf-report-title">Revenue Impact</div>
              <div className="cf-report-value">{fmtUsd(financials?.revenue || 0)}</div>
              <div className="cf-report-note">{financials?.revenue_share}% of total</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
