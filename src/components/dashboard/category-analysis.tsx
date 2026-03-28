"use client";

import type { CategoryData } from "@/hooks/use-dashboard";

interface CategoryAnalysisProps {
  categories: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Medical: "#4CAF50",
  Dental: "#2196F3",
  Maternity: "#E91E63",
  Optical: "#FF9800",
  Laboratory: "#D4AF37",
  Hospitalization: "#607D8B",
  Other: "#607D8B",
};

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function CategoryAnalysis({ categories }: CategoryAnalysisProps) {
  if (!categories.length) return null;

  const totalCases = categories.reduce((a, c) => a + (c.cases || 0), 0);
  const totalCost = categories.reduce((a, c) => a + (c.cost_usd || c.cost_usd || c.cost || 0), 0);

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">📊 Claims by Category</h2>

      {/* Category stat cards */}
      <div className="cat-stats-row">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="cat-stat"
            style={{ borderLeftColor: CATEGORY_COLORS[cat.category] || "#607D8B" }}
          >
            <div
              className="cat-stat-value"
              style={{ color: CATEGORY_COLORS[cat.category] || "#607D8B" }}
            >
              {fmt(cat.cases)}
            </div>
            <div className="cat-stat-label">{cat.category}</div>
          </div>
        ))}
      </div>

      <div className="cat-grid">
        {/* Cases distribution */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">🏥 Category Distribution</h3>
          <div className="cat-bars">
            {categories.map((cat) => {
              const pct = totalCases > 0 ? (cat.cases / totalCases) * 100 : 0;
              return (
                <div key={cat.category} className="cat-bar-row">
                  <span className="cat-bar-label">{cat.category}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat.category] || "#607D8B",
                      }}
                    />
                  </div>
                  <span className="cat-bar-value">{fmt(cat.cases)}</span>
                  <span className="cat-bar-pct">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost by category */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">💰 Cost by Category</h3>
          <div className="cat-bars">
            {categories.map((cat) => {
              const pct = totalCost > 0 ? (cat.cost / totalCost) * 100 : 0;
              return (
                <div key={cat.category} className="cat-bar-row">
                  <span className="cat-bar-label">{cat.category}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat.category] || "#607D8B",
                      }}
                    />
                  </div>
                  <span className="cat-bar-value">{fmtUsd(cat.cost)}</span>
                  <span className="cat-bar-pct">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .cat-stats-row {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; margin-bottom: 1rem;
        }
        .cat-stat {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-left: 4px solid; border-radius: 12px;
          padding: 0.75rem; text-align: center;
        }
        .cat-stat-value { font-family: "Montserrat", sans-serif; font-size: 1.25rem; font-weight: 800; }
        .cat-stat-label { font-size: 0.75rem; color: #7aa0c0; margin-top: 0.25rem; }
        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem;
        }
        .cat-bars { display: flex; flex-direction: column; gap: 0.75rem; }
        .cat-bar-row { display: flex; align-items: center; gap: 0.5rem; }
        .cat-bar-label { font-size: 0.8rem; color: #b8d4e8; width: 100px; flex-shrink: 0; }
        .cat-bar-track { flex: 1; height: 14px; background: rgba(255,255,255,0.08); border-radius: 7px; overflow: hidden; }
        .cat-bar-fill { height: 100%; border-radius: 7px; transition: width 0.6s ease; }
        .cat-bar-value { font-size: 0.8rem; font-weight: 700; color: #ffffff; width: 65px; text-align: right; }
        .cat-bar-pct { font-size: 0.75rem; color: #7aa0c0; width: 45px; text-align: right; }
        @media (max-width: 768px) {
          .cat-stats-row { grid-template-columns: repeat(3, 1fr); }
          .cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}


