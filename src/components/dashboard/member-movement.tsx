"use client";

import type { KPIData } from "@/hooks/use-dashboard";

interface MemberMovementProps {
  kpis: KPIData;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function MemberMovement({ kpis }: MemberMovementProps) {
  const netChange = kpis.new_enrollments - kpis.cancellations;
  const principalTotal = kpis.principal_count + kpis.dependent_count;
  const principalPct =
    principalTotal > 0
      ? ((kpis.principal_count / principalTotal) * 100).toFixed(1)
      : "0";
  const dependentPct =
    principalTotal > 0
      ? ((kpis.dependent_count / principalTotal) * 100).toFixed(1)
      : "0";

  return (
    <>
      {/* Principal vs Dependent */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">
          👥 Principal vs Dependent Analysis
        </h2>
        <div className="movement-grid">
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">👤 Member Type Distribution</h3>
            <div className="movement-stats-row">
              <div className="movement-stat" style={{ borderLeftColor: "#2E7D32" }}>
                <div className="movement-stat-icon">⚓</div>
                <div className="movement-stat-value">{fmt(kpis.principal_count)}</div>
                <div className="movement-stat-label">Seafarers (Principal)</div>
                <div className="movement-stat-pct">{principalPct}%</div>
              </div>
              <div className="movement-stat" style={{ borderLeftColor: "#D4AF37" }}>
                <div className="movement-stat-icon">👨‍👩‍👧</div>
                <div className="movement-stat-value">{fmt(kpis.dependent_count)}</div>
                <div className="movement-stat-label">Dependents</div>
                <div className="movement-stat-pct">{dependentPct}%</div>
              </div>
            </div>
            {/* Visual bar */}
            <div className="type-bar-container">
              <div
                className="type-bar-segment"
                style={{
                  width: `${principalPct}%`,
                  backgroundColor: "#2E7D32",
                }}
              />
              <div
                className="type-bar-segment"
                style={{
                  width: `${dependentPct}%`,
                  backgroundColor: "#D4AF37",
                }}
              />
            </div>
          </div>

          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">📊 Claims by Member Type</h3>
            <div className="movement-stats-row">
              <div className="movement-stat" style={{ borderLeftColor: "#2E7D32" }}>
                <div className="movement-stat-icon">⚓</div>
                <div className="movement-stat-value">{fmt(kpis.principal_claims)}</div>
                <div className="movement-stat-label">Seafarer Claims</div>
              </div>
              <div className="movement-stat" style={{ borderLeftColor: "#D4AF37" }}>
                <div className="movement-stat-icon">👨‍👩‍👧</div>
                <div className="movement-stat-value">{fmt(kpis.dependent_claims)}</div>
                <div className="movement-stat-label">Dependent Claims</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Movement */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">📈 Member Movement</h2>
        <div className="movement-grid three-col">
          <div className="movement-big-stat" style={{ borderLeftColor: "#4CAF50" }}>
            <div className="movement-big-value" style={{ color: "#4CAF50" }}>
              +{fmt(kpis.new_enrollments)}
            </div>
            <div className="movement-big-label">New Members</div>
          </div>
          <div className="movement-big-stat" style={{ borderLeftColor: "#e74c3c" }}>
            <div className="movement-big-value" style={{ color: "#e74c3c" }}>
              -{fmt(kpis.cancellations)}
            </div>
            <div className="movement-big-label">Cancelled</div>
          </div>
          <div className="movement-big-stat" style={{ borderLeftColor: "#D4AF37" }}>
            <div
              className="movement-big-value"
              style={{ color: netChange >= 0 ? "#4CAF50" : "#e74c3c" }}
            >
              {netChange >= 0 ? "+" : ""}
              {fmt(netChange)}
            </div>
            <div className="movement-big-label">Net Growth</div>
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
        .movement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .movement-grid.three-col {
          grid-template-columns: repeat(3, 1fr);
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
        .movement-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .movement-stat {
          background: rgba(255, 255, 255, 0.03);
          border-left: 4px solid;
          border-radius: 8px;
          padding: 0.75rem;
          text-align: center;
        }
        .movement-stat-icon {
          font-size: 1.25rem;
        }
        .movement-stat-value {
          font-family: "Montserrat", sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0.25rem 0;
        }
        .movement-stat-label {
          font-size: 0.7rem;
          color: #7aa0c0;
        }
        .movement-stat-pct {
          font-size: 0.8rem;
          font-weight: 700;
          color: #d4af37;
          margin-top: 0.25rem;
        }
        .type-bar-container {
          display: flex;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.08);
        }
        .type-bar-segment {
          height: 100%;
          transition: width 0.6s ease;
        }
        .movement-big-stat {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070;
          border-left: 4px solid;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
        }
        .movement-big-value {
          font-family: "Montserrat", sans-serif;
          font-size: 2rem;
          font-weight: 800;
        }
        .movement-big-label {
          font-size: 0.85rem;
          color: #7aa0c0;
          margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
          .movement-grid,
          .movement-grid.three-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
