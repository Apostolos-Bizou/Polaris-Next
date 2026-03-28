"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface DashboardStats {
  clients: number;
  offers: number;
  contracts: number;
  members: number;
  pending: number;
}

interface KPIData {
  total_members?: number;
  total_claims?: number;
  total_fees?: number;
  total_claims_cost?: number;
  loss_ratio?: number;
  avg_claim?: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Parallel API calls through our proxy
      const [dashRes, kpiRes] = await Promise.all([
        fetch("/api/proxy/getDashboardKPIs").then((r) => r.json()),
        fetch("/api/proxy/getClientKPISummary?clientId=ALL").then((r) =>
          r.json()
        ),
      ]);

      // Dashboard stats
      if (dashRes.summary) {
        setStats({
          clients: dashRes.summary.active_clients || 0,
          offers: dashRes.summary.open_offers || 0,
          contracts: dashRes.summary.active_contracts || 0,
          members: dashRes.summary.total_members || 0,
          pending: dashRes.summary.pending_signatures || 0,
        });
      }

      // KPI data
      if (kpiRes.kpis) {
        setKpis(kpiRes.kpis);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const formatNumber = (n: number) =>
    new Intl.NumberFormat("el-GR").format(n);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            Welcome back, {session?.user?.name || "Admin"}
          </h1>
          <p className="dash-subtitle">Polaris Admin Dashboard</p>
        </div>
        <button className="dash-refresh" onClick={loadDashboardData}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats bar */}
      {loading ? (
        <div className="dash-loading">
          <div className="dash-spinner" />
          <span>Loading dashboard data...</span>
        </div>
      ) : error ? (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      ) : (
        <>
          {/* Top stats bar */}
          <div className="stats-bar">
            <StatCard label="Active Clients" value={stats?.clients} icon="🏢" />
            <StatCard label="Open Offers" value={stats?.offers} icon="📝" />
            <StatCard
              label="Active Contracts"
              value={stats?.contracts}
              icon="📋"
            />
            <StatCard label="Total Members" value={stats?.members} icon="👥" />
            <StatCard
              label="Pending Signatures"
              value={stats?.pending}
              icon="✍️"
            />
          </div>

          {/* KPI Cards */}
          {kpis && (
            <div className="kpi-grid">
              <KpiCard
                title="Total Members"
                value={formatNumber(kpis.total_members || 0)}
                icon="👥"
                color="#3498db"
              />
              <KpiCard
                title="Total Claims"
                value={formatNumber(kpis.total_claims || 0)}
                icon="📋"
                color="#e67e22"
              />
              <KpiCard
                title="Total Fees"
                value={formatCurrency(kpis.total_fees || 0)}
                icon="💵"
                color="#2ecc71"
              />
              <KpiCard
                title="Claims Cost"
                value={formatCurrency(kpis.total_claims_cost || 0)}
                icon="💸"
                color="#e74c3c"
              />
              <KpiCard
                title="Loss Ratio"
                value={formatPercent(kpis.loss_ratio || 0)}
                icon="📊"
                color={
                  (kpis.loss_ratio || 0) > 0.75 ? "#e74c3c" : "#2ecc71"
                }
              />
              <KpiCard
                title="Avg Claim"
                value={formatCurrency(kpis.avg_claim || 0)}
                icon="📈"
                color="#9b59b6"
              />
            </div>
          )}

          {/* Module cards - same as main dashboard */}
          <h2 className="section-heading">Modules</h2>
          <div className="module-grid">
            <ModuleCard
              href="/clients"
              icon="🏢"
              title="Clients"
              desc="Manage client portfolio"
              color="#3498db"
            />
            <ModuleCard
              href="/offers"
              icon="📝"
              title="New Proposal"
              desc="Create insurance offers"
              color="#9b59b6"
            />
            <ModuleCard
              href="/offers"
              icon="📊"
              title="Comparison Quote"
              desc="Compare plans side by side"
              color="#e67e22"
            />
            <ModuleCard
              href="/contracts"
              icon="📋"
              title="Contracts"
              desc="Active contracts & renewals"
              color="#2ecc71"
            />
            <ModuleCard
              href="/email"
              icon="📧"
              title="Email Center"
              desc="Compose & send emails"
              color="#e74c3c"
            />
            <ModuleCard
              href="/reports"
              icon="📄"
              title="Reports"
              desc="Generate analytics reports"
              color="#1abc9c"
            />
            <ModuleCard
              href="/follow-ups"
              icon="📌"
              title="Follow-ups"
              desc="Track pending actions"
              color="#f39c12"
            />
            <ModuleCard
              href="/renewals"
              icon="🔄"
              title="Renewals"
              desc="Upcoming contract renewals"
              color="#1B5E20"
            />
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .dash-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
        }

        .dash-subtitle {
          color: rgba(184, 212, 232, 0.7);
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .dash-refresh {
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }

        .dash-refresh:hover {
          background: rgba(212, 175, 55, 0.25);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
        }

        .dash-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 4rem;
          color: rgba(184, 212, 232, 0.7);
        }

        .dash-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(212, 175, 55, 0.2);
          border-top-color: #D4AF37;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .dash-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.3);
          border-radius: 12px;
          color: #ff6b6b;
        }

        .dash-error button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
        }

        /* Stats bar */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #0a1628, #1e3a5f);
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .section-heading {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #D4AF37;
          margin-bottom: 1.25rem;
          letter-spacing: 1px;
        }

        /* Module grid */
        .module-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 1200px) {
          .stats-bar { grid-template-columns: repeat(3, 1fr); }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .module-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
          .stats-bar { grid-template-columns: repeat(2, 1fr); }
          .kpi-grid { grid-template-columns: 1fr; }
          .module-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-header { flex-direction: column; gap: 1rem; }
        }

        @media (max-width: 480px) {
          .module-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value?: number;
  icon: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0.5rem",
      }}
    >
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D4AF37", fontFamily: "Montserrat, sans-serif" }}>
        {value !== undefined ? new Intl.NumberFormat("el-GR").format(value) : "--"}
      </div>
      <div style={{ fontSize: "0.75rem", color: "rgba(184, 212, 232, 0.7)", marginTop: "0.25rem" }}>
        {icon} {label}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0d1f2d, rgba(10, 22, 40, 0.9))",
        border: `1px solid ${color}33`,
        borderRadius: "16px",
        padding: "1.5rem",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "rgba(184, 212, 232, 0.7)", textTransform: "uppercase", letterSpacing: "1px" }}>
          {title}
        </span>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
      </div>
      <div
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          fontFamily: "Montserrat, sans-serif",
          color: color,
          marginTop: "0.75rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <a
      href={href}
      style={{
        background: "linear-gradient(145deg, #0d1f2d, rgba(10, 22, 40, 0.9))",
        border: `2px solid ${color}44`,
        borderRadius: "20px",
        padding: "2rem 1.5rem",
        textDecoration: "none",
        textAlign: "center",
        transition: "all 0.4s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-8px)";
        el.style.borderColor = color;
        el.style.boxShadow = `0 15px 40px ${color}33`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.borderColor = `${color}44`;
        el.style.boxShadow = "none";
      }}
    >
      <span style={{ fontSize: "3rem" }}>{icon}</span>
      <span
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "#ffffff",
          letterSpacing: "1px",
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: "0.8rem", color: "rgba(184, 212, 232, 0.6)" }}>
        {desc}
      </span>
    </a>
  );
}
