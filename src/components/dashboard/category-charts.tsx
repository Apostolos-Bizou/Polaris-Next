"use client";

import { Doughnut, Bar } from "@/components/charts/chart-config";
import type { CategoryData } from "@/hooks/use-dashboard";

interface CategoryChartsProps {
  categories: CategoryData[];
}

const COLORS = ["#4CAF50", "#2196F3", "#D4AF37", "#607D8B", "#E91E63", "#FF9800", "#9C27B0"];
const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtK = (n: number) => "$" + (n / 1000).toFixed(0) + "K";

export function CategoryCharts({ categories }: CategoryChartsProps) {
  if (!categories.length) return null;

  // Donut
  const donutData = {
    labels: categories.map((c) => c.category),
    datasets: [{
      data: categories.map((c) => c.cases),
      backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length] + "CC"),
      borderColor: categories.map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 2,
      hoverOffset: 8,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: { color: "#b8d4e8", font: { family: "'Montserrat', sans-serif", size: 11 }, padding: 12, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "rgba(10, 22, 40, 0.95)",
        titleColor: "#D4AF37",
        bodyColor: "#b8d4e8",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        cornerRadius: 10,
      },
    },
  };

  // Horizontal bar for cost
  const costBarData = {
    labels: categories.map((c) => c.category),
    datasets: [{
      data: categories.map((c) => c.cost_usd || c.cost_usd || c.cost || 0),
      backgroundColor: categories.map((_, i) => COLORS[i % COLORS.length] + "CC"),
      borderColor: categories.map((_, i) => COLORS[i % COLORS.length]),
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const costBarOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 22, 40, 0.95)",
        titleColor: "#D4AF37",
        bodyColor: "#b8d4e8",
        callbacks: { label: (ctx: any) => fmtK(ctx.raw) },
      },
    },
    scales: {
      x: {
        ticks: { color: "#7aa0c0", callback: (v: any) => "$" + (Number(v) / 1000).toFixed(0) + "K" },
        grid: { color: "rgba(45, 80, 112, 0.15)" },
      },
      y: {
        ticks: { color: "#b8d4e8", font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">📊 Claims by Category</h2>

      {/* Category stat cards */}
      <div className="cat-stats-row">
        {categories.map((cat, i) => (
          <div key={cat.category} className="cat-stat" style={{ borderLeftColor: COLORS[i % COLORS.length] }}>
            <div className="cat-stat-value" style={{ color: COLORS[i % COLORS.length] }}>
              {fmt(cat.cases)}
            </div>
            <div className="cat-stat-label">{cat.category}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">🏥 Category Distribution</h3>
          <div style={{ height: "300px" }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">💰 Cost by Category</h3>
          <div style={{ height: "300px" }}>
            <Bar data={costBarData} options={costBarOptions} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-title-polaris { font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(212, 175, 55, 0.3); }
        .cat-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
        .cat-stat { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-left: 4px solid; border-radius: 12px; padding: 0.75rem; text-align: center; }
        .cat-stat-value { font-family: "Montserrat", sans-serif; font-size: 1.25rem; font-weight: 800; }
        .cat-stat-label { font-size: 0.7rem; color: #7aa0c0; margin-top: 0.25rem; }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem; }
        .chart-title-polaris { font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; }
        @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}


