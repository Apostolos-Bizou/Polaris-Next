"use client";

import type { KPIData, QuarterData } from "@/hooks/use-dashboard";

interface FinancialSectionProps {
  kpis: KPIData;
  quarterData: QuarterData[];
  selectedYear: number;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => n.toFixed(1) + "%";

export function FinancialSection({
  kpis,
  quarterData,
  selectedYear,
}: FinancialSectionProps) {
  const costPerMember =
    kpis.total_members > 0 ? kpis.total_cost_usd / kpis.total_members : 0;
  const utilization =
    kpis.total_members > 0 ? (kpis.total_claims / kpis.total_members) * 100 : 0;
  const claimsPer1000 =
    kpis.total_members > 0 ? (kpis.total_claims / kpis.total_members) * 1000 : 0;
  const avgClaimValue =
    kpis.total_claims > 0 ? kpis.total_cost_usd / kpis.total_claims : 0;
  const lossRatio = kpis.loss_ratio || 0;
  const targetCostPerMember = 50;
  const gaugePercent = Math.min((costPerMember / targetCostPerMember) * 100, 100);

  return (
    <>
      {/* FINANCE DIVIDER */}
      <div className="section-divider-polaris">FINANCE</div>

      {/* Utilization Metrics */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">📈 Utilization Metrics</h2>
        <div className="util-grid">
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">📊 Key Metrics</h3>
            <div className="util-metric-list">
              <div className="util-metric">
                <span className="util-metric-label">Utilization Rate</span>
                <span className="util-metric-value">{fmtPct(utilization)}</span>
                <div className="util-bar-track">
                  <div className="util-bar-fill" style={{ width: `${Math.min(utilization * 2, 100)}%`, backgroundColor: utilization > 50 ? "#e74c3c" : "#4CAF50" }} />
                </div>
              </div>
              <div className="util-metric">
                <span className="util-metric-label">Claims Ratio</span>
                <span className="util-metric-value">{fmtPct(lossRatio * 100)}</span>
                <div className="util-bar-track">
                  <div className="util-bar-fill" style={{ width: `${Math.min(lossRatio * 100, 100)}%`, backgroundColor: lossRatio > 0.75 ? "#e74c3c" : "#4CAF50" }} />
                </div>
              </div>
              <div className="util-metric">
                <span className="util-metric-label">Cost Efficiency</span>
                <span className="util-metric-value">{fmtPct(gaugePercent)}</span>
                <div className="util-bar-track">
                  <div className="util-bar-fill" style={{ width: `${gaugePercent}%`, backgroundColor: gaugePercent > 80 ? "#e74c3c" : "#4CAF50" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">🎯 Cost vs Target</h3>
            <div className="gauge-container">
              <svg viewBox="0 0 200 120" className="gauge-svg">
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" strokeLinecap="round" />
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={gaugePercent > 80 ? "#e74c3c" : gaugePercent > 50 ? "#D4AF37" : "#4CAF50"} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${gaugePercent * 2.51} 251`} />
              </svg>
              <div className="gauge-value">{fmtUsd(costPerMember)}</div>
              <div className="gauge-label">Cost per Member</div>
              <div className="gauge-target">Target: {fmtUsd(targetCostPerMember)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Analysis */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">📋 Claims Analysis</h2>
        <div className="claims-analysis-grid">
          <div className="analysis-card">
            <div className="analysis-label">Claims by Period</div>
            <div className="analysis-value" style={{ color: "#3498db" }}>{fmt(kpis.total_claims)}</div>
          </div>
          <div className="analysis-card">
            <div className="analysis-label">Claims per 1000</div>
            <div className="analysis-value" style={{ color: "#e67e22" }}>{claimsPer1000.toFixed(0)}</div>
          </div>
          <div className="analysis-card">
            <div className="analysis-label">Avg Claim Value</div>
            <div className="analysis-value" style={{ color: "#2ecc71" }}>{fmtUsd(avgClaimValue)}</div>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      {quarterData.length > 0 && (
        <div className="section-polaris">
          <h2 className="section-title-polaris">📋 Historical Data</h2>
          <div className="chart-card-polaris">
            <div className="hist-table-wrapper">
              <table className="hist-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Period</th>
                    <th>Members</th>
                    <th>Claims</th>
                    <th>USD</th>
                    <th>Cost/Member</th>
                    <th>Util %</th>
                  </tr>
                </thead>
                <tbody>
                  {[...quarterData].reverse().map((qd, i) => {
                    const cpm = qd.kpis.total_members > 0 ? qd.kpis.total_cost_usd / qd.kpis.total_members : 0;
                    const ut = qd.kpis.total_members > 0 ? (qd.kpis.total_claims / qd.kpis.total_members) * 100 : 0;
                    return (
                      <tr key={qd.quarter}>
                        <td>
                          <span className="hist-rank" style={{ backgroundColor: i === 0 ? "#e74c3c" : i === 1 ? "#D4AF37" : "#4CAF50" }}>
                            {i + 1}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{qd.quarter} {selectedYear}</td>
                        <td>{fmt(qd.kpis.total_members)}</td>
                        <td>{fmt(qd.kpis.total_claims)}</td>
                        <td style={{ color: "#D4AF37" }}>{fmtUsd(qd.kpis.total_cost_usd)}</td>
                        <td style={{ color: "#3498db" }}>{fmtUsd(cpm)}</td>
                        <td>{fmtPct(ut)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-divider-polaris {
          text-align: center; padding: 1rem 0; font-family: "Montserrat", sans-serif;
          font-size: 0.85rem; font-weight: 800; letter-spacing: 3px;
          color: rgba(184, 212, 232, 0.5); margin: 1rem 0 0.5rem;
        }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .util-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem;
        }
        .util-metric-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .util-metric { display: flex; flex-direction: column; gap: 0.5rem; }
        .util-metric-label { font-size: 0.85rem; color: #b8d4e8; }
        .util-metric-value { font-family: "Montserrat", sans-serif; font-size: 1.5rem; font-weight: 800; color: #ffffff; }
        .util-bar-track { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
        .util-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .gauge-container { text-align: center; padding: 1rem 0; }
        .gauge-svg { width: 180px; height: 110px; }
        .gauge-value { font-family: "Montserrat", sans-serif; font-size: 2rem; font-weight: 800; color: #D4AF37; margin-top: -0.5rem; }
        .gauge-label { font-size: 0.85rem; color: #b8d4e8; margin-top: 0.25rem; }
        .gauge-target { font-size: 0.8rem; color: #7aa0c0; margin-top: 0.25rem; }
        .claims-analysis-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .analysis-card {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.5rem; text-align: center;
        }
        .analysis-label { font-size: 0.8rem; color: #7aa0c0; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
        .analysis-value { font-family: "Montserrat", sans-serif; font-size: 1.75rem; font-weight: 800; }
        .hist-table-wrapper { overflow-x: auto; }
        .hist-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .hist-table th {
          text-align: left; padding: 0.75rem 0.5rem; color: #7aa0c0;
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid #2d5070;
        }
        .hist-table td { padding: 0.75rem 0.5rem; color: #b8d4e8; border-bottom: 1px solid rgba(45,80,112,0.2); }
        .hist-table tr:hover td { background: rgba(212,175,55,0.05); }
        .hist-rank {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: #fff;
        }
        @media (max-width: 768px) {
          .util-grid { grid-template-columns: 1fr; }
          .claims-analysis-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
