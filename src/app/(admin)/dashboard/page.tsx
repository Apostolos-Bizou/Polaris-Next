"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { QuarterSelector } from "@/components/dashboard/quarter-selector";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { InOutCharts } from "@/components/dashboard/inout-charts";
import { MovementCharts } from "@/components/dashboard/movement-charts";
import { CategoryCharts } from "@/components/dashboard/category-charts";
import { HospitalsTable } from "@/components/dashboard/hospitals-table";
import { GeoDistribution } from "@/components/dashboard/geo-distribution";
import { FinancialSection } from "@/components/dashboard/financial-section";
import { CEODashboard } from "@/components/dashboard/ceo-dashboard";
import CategoryTrend from "@/components/dashboard/category-trend";
import YearOverYear from "@/components/dashboard/year-over-year";
import FeesCharges from "@/components/dashboard/fees-charges";
import PlanPerformance from "@/components/dashboard/plan-performance";
import CBMSReport from "@/components/dashboard/cbms-report";

export default function DashboardPage() {
  const {
    loading, error, clients, selectedClient, selectedYear,
    selectedQuarters, cumulativeMode, compareMode,
    clientDisplayName, realMemberCount,
    stats, kpis, quarterData, categories, hospitals, geoData,
    setSelectedClient, setSelectedYear, toggleQuarter,
    setCumulativeMode, setCompareMode, refresh,
  } = useDashboard();

  return (
    <div className="dashboard-page">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">🏢 Admin Dashboard</h1>
          <p className="dash-page-subtitle">
            Company-wide analytics and insights
            <span className="client-badge">{clientDisplayName}</span>
          </p>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <StatsBar stats={stats} />

      {/* ── Quarter Selector (with grouped client dropdown) ──────── */}
      <QuarterSelector
        clients={clients}
        selectedClient={selectedClient}
        selectedYear={selectedYear}
        selectedQuarters={selectedQuarters}
        cumulativeMode={cumulativeMode}
        compareMode={compareMode}
        onClientChange={setSelectedClient}
        onYearChange={setSelectedYear}
        onQuarterToggle={toggleQuarter}
        onCumulativeToggle={() => setCumulativeMode(!cumulativeMode)}
        onCompareToggle={() => setCompareMode(!compareMode)}
        onRefresh={refresh}
      />

      {/* ── Loading State ────────────────────────────────────────── */}
      {loading && (
        <div className="dash-loading">
          <div className="dash-loading-content">
            <div className="dash-spinner" />
            <div className="dash-loading-text">Loading Dashboard Data...</div>
            <div className="dash-loading-sub">
              {selectedClient === "ALL"
                ? "Fetching KPIs and analytics from server"
                : `Loading data for ${clientDisplayName}...`}
            </div>
          </div>
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────── */}
      {error && !loading && (
        <div className="dash-error">
          <span>⚠️ {error}</span>
          <button onClick={refresh}>🔄 Retry</button>
        </div>
      )}

      {/* ── Dashboard Content ────────────────────────────────────── */}
      {!loading && !error && (
        <>
          <div className="section-divider">📈 BUSINESS STRATEGY</div>
          <KpiGrid kpis={kpis} />

          {/* Quarter Comparison (when multiple quarters selected) */}
          {quarterData.length > 1 && (
            <div style={{ marginBottom: "2rem" }}>
              <h2 className="stitle">
                ⚖️ Quarter Comparison: {quarterData.map(q => q.quarter).join(" vs ")} {selectedYear}
              </h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${quarterData.length}, 1fr)`,
                gap: "1rem",
              }}>
                {quarterData.map(qd => (
                  <div key={qd.quarter} className="qcard">
                    <div className="qcard-header">{qd.quarter}</div>
                    <div className="qcard-row">
                      <span>Members</span>
                      <strong>{new Intl.NumberFormat("en-US").format(qd.kpis.total_members)}</strong>
                    </div>
                    <div className="qcard-row">
                      <span>Claims</span>
                      <strong>{new Intl.NumberFormat("en-US").format(qd.kpis.total_claims)}</strong>
                    </div>
                    <div className="qcard-row">
                      <span>Cost</span>
                      <strong>
                        ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(qd.kpis.total_cost_usd)}
                      </strong>
                    </div>
                    <div className="qcard-row">
                      <span>Utilization</span>
                      <strong>
                        {qd.kpis.total_members > 0
                          ? ((qd.kpis.total_claims / qd.kpis.total_members) * 100).toFixed(1)
                          : 0}%
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart.js Sections */}
          <InOutCharts kpis={kpis} quarterData={quarterData} selectedYear={selectedYear} />
          <MovementCharts kpis={kpis} quarterData={quarterData} selectedYear={selectedYear} />
          <CategoryCharts categories={categories} />
          <CategoryTrend categories={categories} />
          <YearOverYear currentYear={selectedYear} />
          <HospitalsTable hospitals={hospitals} />
          <GeoDistribution geoData={geoData} />
          <FeesCharges costPerMember={kpis?.avg_cost_per_member} />
          <PlanPerformance totalMembers={kpis?.total_members} />
          <FinancialSection kpis={kpis} quarterData={quarterData} selectedYear={selectedYear} />
          <CEODashboard />
          <CBMSReport />

          <div className="dash-footer">
            ✦ POLARIS Financial Services › Third Party Healthcare Administrator › Fast › Fair › Flexible
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-page { max-width: 1400px; margin: 0 auto; }
        .dash-page-header { margin-bottom: 1.5rem; }
        .dash-page-title { font-family: "Montserrat", sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .dash-page-subtitle { color: rgba(184,212,232,0.7); font-size: 0.9rem; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .client-badge { background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3); padding: 0.2rem 0.75rem; border-radius: 20px; font-size: 0.8rem; color: #d4af37; font-weight: 600; }
        .dash-loading { display: flex; flex-direction: column; align-items: center; padding: 4rem; }
        .dash-loading-content { text-align: center; }
        .dash-spinner { width: 40px; height: 40px; border: 3px solid rgba(212,175,55,0.2); border-top-color: #d4af37; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-loading-text { font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700; color: #d4af37; }
        .dash-loading-sub { color: #5a6a7a; font-size: 0.85rem; margin-top: 0.5rem; }
        .dash-error { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); border-radius: 12px; color: #ff6b6b; }
        .dash-error button { background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: inherit; }
        .section-divider { text-align: center; padding: 0.75rem 0; margin-bottom: 1rem; font-family: "Montserrat", sans-serif; font-size: 0.85rem; font-weight: 800; letter-spacing: 3px; color: rgba(184,212,232,0.5); }
        .stitle { font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; }
        .qcard { background: rgba(13, 27, 42, 0.8); border: 1px solid rgba(45, 80, 112, 0.3); border-radius: 12px; padding: 1.25rem; }
        .qcard-header { font-family: "Montserrat", sans-serif; font-weight: 700; font-size: 1.25rem; color: #D4AF37; text-align: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(212,175,55,0.2); }
        .qcard-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(45,80,112,0.15); }
        .qcard-row span { color: #7aa0c0; font-size: 0.85rem; }
        .qcard-row strong { color: #ffffff; font-family: "Montserrat", sans-serif; font-weight: 700; }
        .dash-footer { text-align: center; padding: 2rem 0; margin-top: 2rem; color: rgba(184,212,232,0.3); font-size: 0.8rem; font-weight: 600; letter-spacing: 2px; }
      `}</style>
    </div>
  );
}
