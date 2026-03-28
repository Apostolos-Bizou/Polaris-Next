"use client";

import { Bar, Line } from "@/components/charts/chart-config";
import type { KPIData, QuarterData } from "@/hooks/use-dashboard";

interface MovementChartsProps {
  kpis: KPIData;
  quarterData: QuarterData[];
  selectedYear: number;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function MovementCharts({ kpis, quarterData, selectedYear }: MovementChartsProps) {
  const netChange = kpis.new_enrollments - kpis.cancellations;

  // Movement bar chart
  const movementBarData = {
    labels: ["New Enrollments", "Cancellations"],
    datasets: [{
      data: [kpis.new_enrollments, kpis.cancellations],
      backgroundColor: ["rgba(76, 175, 80, 0.8)", "rgba(231, 76, 60, 0.8)"],
      borderColor: ["#4CAF50", "#e74c3c"],
      borderWidth: 2,
      borderRadius: 10,
      borderSkipped: false,
    }],
  };

  const movementBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 22, 40, 0.95)",
        titleColor: "#D4AF37",
        bodyColor: "#b8d4e8",
      },
    },
    scales: {
      x: { ticks: { color: "#7aa0c0" }, grid: { display: false } },
      y: { ticks: { color: "#7aa0c0" }, grid: { color: "rgba(45, 80, 112, 0.15)" } },
    },
  };

  // Trend line
  const trendLabels = quarterData.map(q => `${q.quarter} ${selectedYear}`);
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Enrollments",
        data: quarterData.map(q => q.kpis.new_enrollments),
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.15)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: "#4CAF50",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: "Cancellations",
        data: quarterData.map(q => q.kpis.cancellations),
        borderColor: "#e74c3c",
        backgroundColor: "rgba(231, 76, 60, 0.15)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointBackgroundColor: "#e74c3c",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: "Net Change",
        data: quarterData.map(q => q.kpis.new_enrollments - q.kpis.cancellations),
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 5,
        pointBackgroundColor: "#D4AF37",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#b8d4e8", font: { family: "'Montserrat', sans-serif", size: 11 }, usePointStyle: true } },
      tooltip: { backgroundColor: "rgba(10, 22, 40, 0.95)", titleColor: "#D4AF37", bodyColor: "#b8d4e8" },
    },
    scales: {
      x: { ticks: { color: "#7aa0c0" }, grid: { color: "rgba(45, 80, 112, 0.15)" } },
      y: { ticks: { color: "#7aa0c0" }, grid: { color: "rgba(45, 80, 112, 0.15)" } },
    },
  };

  // Principal vs Dependent donut
  const principalTotal = kpis.principal_count + kpis.dependent_count;

  return (
    <>
      {/* Principal vs Dependent */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">👥 Principal vs Dependent Analysis</h2>
        <div className="charts-row">
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">👤 Member Type Distribution</h3>
            <div className="type-stats">
              <div className="type-stat" style={{ borderLeftColor: "#2E7D32" }}>
                <span className="type-icon">⚓</span>
                <span className="type-val">{fmt(kpis.principal_count)}</span>
                <span className="type-lbl">Seafarers (Principal)</span>
                <span className="type-pct">{principalTotal > 0 ? ((kpis.principal_count / principalTotal) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="type-stat" style={{ borderLeftColor: "#D4AF37" }}>
                <span className="type-icon">👨‍👩‍👧</span>
                <span className="type-val">{fmt(kpis.dependent_count)}</span>
                <span className="type-lbl">Dependents</span>
                <span className="type-pct">{principalTotal > 0 ? ((kpis.dependent_count / principalTotal) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
            <div className="type-bar-container">
              <div className="type-bar-seg" style={{ width: `${principalTotal > 0 ? (kpis.principal_count / principalTotal) * 100 : 50}%`, backgroundColor: "#2E7D32" }} />
              <div className="type-bar-seg" style={{ width: `${principalTotal > 0 ? (kpis.dependent_count / principalTotal) * 100 : 50}%`, backgroundColor: "#D4AF37" }} />
            </div>
          </div>
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">📊 Claims by Member Type</h3>
            <div className="type-stats">
              <div className="type-stat" style={{ borderLeftColor: "#2E7D32" }}>
                <span className="type-icon">⚓</span>
                <span className="type-val">{fmt(kpis.principal_claims)}</span>
                <span className="type-lbl">Seafarer Claims</span>
              </div>
              <div className="type-stat" style={{ borderLeftColor: "#D4AF37" }}>
                <span className="type-icon">👨‍👩‍👧</span>
                <span className="type-val">{fmt(kpis.dependent_claims)}</span>
                <span className="type-lbl">Dependent Claims</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Movement */}
      <div className="section-polaris">
        <h2 className="section-title-polaris">📈 Member Movement</h2>
        <div className="movement-big-stats">
          <div className="movement-big" style={{ borderLeftColor: "#4CAF50" }}>
            <div className="movement-big-val" style={{ color: "#4CAF50" }}>+{fmt(kpis.new_enrollments)}</div>
            <div className="movement-big-lbl">New Members</div>
          </div>
          <div className="movement-big" style={{ borderLeftColor: "#e74c3c" }}>
            <div className="movement-big-val" style={{ color: "#e74c3c" }}>-{fmt(kpis.cancellations)}</div>
            <div className="movement-big-lbl">Cancelled</div>
          </div>
          <div className="movement-big" style={{ borderLeftColor: "#D4AF37" }}>
            <div className="movement-big-val" style={{ color: netChange >= 0 ? "#4CAF50" : "#e74c3c" }}>{netChange >= 0 ? "+" : ""}{fmt(netChange)}</div>
            <div className="movement-big-lbl">Net Growth</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">📊 Movement Summary</h3>
            <div style={{ height: "280px" }}>
              <Bar data={movementBarData} options={movementBarOptions} />
            </div>
          </div>
          {quarterData.length > 1 && (
            <div className="chart-card-polaris">
              <h3 className="chart-title-polaris">📈 Movement Trend</h3>
              <div style={{ height: "280px" }}>
                <Line data={trendData} options={trendOptions} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-title-polaris { font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(212, 175, 55, 0.3); }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem; }
        .chart-title-polaris { font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; }
        .type-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
        .type-stat { background: rgba(255,255,255,0.03); border-left: 4px solid; border-radius: 8px; padding: 0.75rem; text-align: center; }
        .type-icon { font-size: 1.25rem; display: block; }
        .type-val { font-family: "Montserrat", sans-serif; font-size: 1.25rem; font-weight: 800; color: #ffffff; display: block; margin: 0.25rem 0; }
        .type-lbl { font-size: 0.7rem; color: #7aa0c0; display: block; }
        .type-pct { font-size: 0.8rem; font-weight: 700; color: #D4AF37; display: block; margin-top: 0.25rem; }
        .type-bar-container { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: rgba(255,255,255,0.08); }
        .type-bar-seg { height: 100%; transition: width 0.6s ease; }
        .movement-big-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
        .movement-big { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-left: 4px solid; border-radius: 16px; padding: 1.5rem; text-align: center; }
        .movement-big-val { font-family: "Montserrat", sans-serif; font-size: 2rem; font-weight: 800; }
        .movement-big-lbl { font-size: 0.85rem; color: #7aa0c0; margin-top: 0.5rem; }
        @media (max-width: 768px) { .charts-row, .movement-big-stats { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
