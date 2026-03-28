"use client";

import type { KPIData } from "@/hooks/use-dashboard";

interface InOutAnalysisProps {
  kpis: KPIData;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function InOutAnalysis({ kpis }: InOutAnalysisProps) {
  const totalCases =
    kpis.inpatient_cases + kpis.outpatient_cases + kpis.ex_gratia_cases;
  const totalCost =
    kpis.inpatient_cost + kpis.outpatient_cost + kpis.ex_gratia_cost;

  const casesData = [
    {
      label: "Inpatient",
      icon: "🏨",
      value: kpis.inpatient_cases,
      cost: kpis.inpatient_cost,
      color: "#e74c3c",
      pct: totalCases > 0 ? (kpis.inpatient_cases / totalCases) * 100 : 0,
      costPct: totalCost > 0 ? (kpis.inpatient_cost / totalCost) * 100 : 0,
    },
    {
      label: "Outpatient",
      icon: "🏃",
      value: kpis.outpatient_cases,
      cost: kpis.outpatient_cost,
      color: "#3498db",
      pct: totalCases > 0 ? (kpis.outpatient_cases / totalCases) * 100 : 0,
      costPct: totalCost > 0 ? (kpis.outpatient_cost / totalCost) * 100 : 0,
    },
    {
      label: "Ex Gratia",
      icon: "🎁",
      value: kpis.ex_gratia_cases,
      cost: kpis.ex_gratia_cost,
      color: "#D4AF37",
      pct: totalCases > 0 ? (kpis.ex_gratia_cases / totalCases) * 100 : 0,
      costPct: totalCost > 0 ? (kpis.ex_gratia_cost / totalCost) * 100 : 0,
    },
  ];

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">
        🏥 Inpatient vs Outpatient Analysis
      </h2>

      <div className="inout-grid">
        {/* Cases */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">📊 Cases Distribution</h3>
          <div className="inout-stats">
            {casesData.map((d) => (
              <div
                key={d.label}
                className="inout-stat"
                style={{ borderLeftColor: d.color }}
              >
                <div className="inout-stat-icon">{d.icon}</div>
                <div className="inout-stat-value">{fmt(d.value)}</div>
                <div className="inout-stat-label">{d.label} Cases</div>
              </div>
            ))}
          </div>
          {/* Bar chart */}
          <div className="inout-bars">
            {casesData.map((d) => (
              <div key={d.label} className="inout-bar-row">
                <span className="inout-bar-label">{d.label}</span>
                <div className="inout-bar-track">
                  <div
                    className="inout-bar-fill"
                    style={{
                      width: `${d.pct}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
                <span className="inout-bar-pct">{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Costs */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">💰 Cost Comparison</h3>
          <div className="inout-stats">
            {casesData.map((d) => (
              <div
                key={d.label}
                className="inout-stat"
                style={{ borderLeftColor: d.color }}
              >
                <div className="inout-stat-icon">💵</div>
                <div className="inout-stat-value">{fmtUsd(d.cost)}</div>
                <div className="inout-stat-label">{d.label} Cost</div>
              </div>
            ))}
          </div>
          <div className="inout-bars">
            {casesData.map((d) => (
              <div key={d.label} className="inout-bar-row">
                <span className="inout-bar-label">{d.label}</span>
                <div className="inout-bar-track">
                  <div
                    className="inout-bar-fill"
                    style={{
                      width: `${d.costPct}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
                <span className="inout-bar-pct">{d.costPct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .section-polaris {
          margin-bottom: 2rem;
        }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .inout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070;
          border-radius: 16px;
          padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
        }
        .inout-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .inout-stat {
          background: rgba(255, 255, 255, 0.03);
          border-left: 4px solid;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }
        .inout-stat-icon {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }
        .inout-stat-value {
          font-family: "Montserrat", sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
        }
        .inout-stat-label {
          font-size: 0.7rem;
          color: #7aa0c0;
          margin-top: 0.25rem;
        }
        .inout-bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .inout-bar-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .inout-bar-label {
          font-size: 0.8rem;
          color: #b8d4e8;
          width: 80px;
          flex-shrink: 0;
        }
        .inout-bar-track {
          flex: 1;
          height: 10px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          overflow: hidden;
        }
        .inout-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.6s ease;
        }
        .inout-bar-pct {
          font-size: 0.8rem;
          font-weight: 700;
          color: #d4af37;
          width: 50px;
          text-align: right;
        }
        @media (max-width: 768px) {
          .inout-grid {
            grid-template-columns: 1fr;
          }
          .inout-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
