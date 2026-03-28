"use client";

import { useRef, useEffect } from "react";
import { Doughnut, Bar, Line } from "@/components/charts/chart-config";
import type { KPIData, QuarterData } from "@/hooks/use-dashboard";

interface InOutChartsProps {
  kpis: KPIData;
  quarterData: QuarterData[];
  selectedYear: number;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function InOutCharts({ kpis, quarterData, selectedYear }: InOutChartsProps) {
  const totalCases = kpis.inpatient_cases + kpis.outpatient_cases + kpis.ex_gratia_cases;

  // Donut data
  const donutData = {
    labels: ["Inpatient", "Outpatient", "Ex Gratia"],
    datasets: [{
      data: [kpis.inpatient_cases, kpis.outpatient_cases, kpis.ex_gratia_cases],
      backgroundColor: [
        "rgba(231, 76, 60, 0.85)",
        "rgba(52, 152, 219, 0.85)",
        "rgba(212, 175, 55, 0.85)",
      ],
      borderColor: ["#e74c3c", "#3498db", "#D4AF37"],
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
        position: "bottom" as const,
        labels: { color: "#b8d4e8", font: { family: "'Montserrat', sans-serif", size: 11 }, padding: 15, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "rgba(10, 22, 40, 0.95)",
        titleColor: "#D4AF37",
        bodyColor: "#b8d4e8",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
      },
    },
  };

  // Cost bar chart
  const costBarData = {
    labels: ["Inpatient", "Outpatient", "Ex Gratia"],
    datasets: [{
      data: [kpis.inpatient_cost, kpis.outpatient_cost, kpis.ex_gratia_cost],
      backgroundColor: [
        "rgba(231, 76, 60, 0.8)",
        "rgba(52, 152, 219, 0.8)",
        "rgba(212, 175, 55, 0.8)",
      ],
      borderColor: ["#e74c3c", "#3498db", "#D4AF37"],
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const costBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 22, 40, 0.95)",
        titleColor: "#D4AF37",
        bodyColor: "#b8d4e8",
        borderColor: "rgba(212, 175, 55, 0.3)",
        borderWidth: 1,
        cornerRadius: 10,
        callbacks: { label: (ctx: any) => fmtUsd(ctx.raw) },
      },
    },
    scales: {
      x: { ticks: { color: "#7aa0c0" }, grid: { display: false } },
      y: {
        ticks: { color: "#7aa0c0", callback: (v: any) => "$" + (v / 1000).toFixed(0) + "K" },
        grid: { color: "rgba(45, 80, 112, 0.15)" },
      },
    },
  };

  // Trend line chart
  const trendLabels = quarterData.map(q => `${q.quarter} ${selectedYear}`);
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Inpatient",
        data: quarterData.map(q => q.kpis.inpatient_cases),
        borderColor: "#e74c3c",
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: "#e74c3c",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: "Outpatient",
        data: quarterData.map(q => q.kpis.outpatient_cases),
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: "#3498db",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: "Ex Gratia",
        data: quarterData.map(q => q.kpis.ex_gratia_cases),
        borderColor: "#D4AF37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
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
      legend: {
        labels: { color: "#b8d4e8", font: { family: "'Montserrat', sans-serif", size: 11 }, usePointStyle: true },
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
    scales: {
      x: { ticks: { color: "#7aa0c0" }, grid: { color: "rgba(45, 80, 112, 0.15)" } },
      y: { ticks: { color: "#7aa0c0" }, grid: { color: "rgba(45, 80, 112, 0.15)" } },
    },
  };

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">🏥 Inpatient vs Outpatient Analysis</h2>

      {/* Stats row */}
      <div className="inout-stats-row">
        <div className="inout-stat" style={{ borderLeftColor: "#e74c3c" }}>
          <span className="inout-icon">🏨</span>
          <span className="inout-val">{fmt(kpis.inpatient_cases)}</span>
          <span className="inout-lbl">Inpatient Cases</span>
        </div>
        <div className="inout-stat" style={{ borderLeftColor: "#3498db" }}>
          <span className="inout-icon">🏃</span>
          <span className="inout-val">{fmt(kpis.outpatient_cases)}</span>
          <span className="inout-lbl">Outpatient Cases</span>
        </div>
        <div className="inout-stat" style={{ borderLeftColor: "#D4AF37" }}>
          <span className="inout-icon">🎁</span>
          <span className="inout-val">{fmt(kpis.ex_gratia_cases)}</span>
          <span className="inout-lbl">Ex Gratia Cases</span>
        </div>
      </div>

      <div className="charts-row">
        {/* Donut */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">📊 Cases Distribution</h3>
          <div style={{ height: "280px" }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>

        {/* Cost bar */}
        <div className="chart-card-polaris">
          <h3 className="chart-title-polaris">💰 Cost Comparison</h3>
          <div className="cost-stats-row">
            <div className="cost-stat" style={{ borderLeftColor: "#e74c3c" }}>
              <span className="cost-val">{fmtUsd(kpis.inpatient_cost)}</span>
              <span className="cost-lbl">Inpatient</span>
            </div>
            <div className="cost-stat" style={{ borderLeftColor: "#3498db" }}>
              <span className="cost-val">{fmtUsd(kpis.outpatient_cost)}</span>
              <span className="cost-lbl">Outpatient</span>
            </div>
            <div className="cost-stat" style={{ borderLeftColor: "#D4AF37" }}>
              <span className="cost-val">{fmtUsd(kpis.ex_gratia_cost)}</span>
              <span className="cost-lbl">Ex Gratia</span>
            </div>
          </div>
          <div style={{ height: "200px" }}>
            <Bar data={costBarData} options={costBarOptions} />
          </div>
        </div>
      </div>

      {/* Trend chart */}
      {quarterData.length > 1 && (
        <div className="chart-card-polaris" style={{ marginTop: "1rem" }}>
          <h3 className="chart-title-polaris">📈 Inpatient vs Outpatient Trend</h3>
          <div style={{ height: "300px" }}>
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>
      )}

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem; padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .inout-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
        .inout-stat {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-left: 4px solid; border-radius: 12px;
          padding: 0.75rem; text-align: center;
        }
        .inout-icon { font-size: 1.25rem; display: block; }
        .inout-val { font-family: "Montserrat", sans-serif; font-size: 1.25rem; font-weight: 800; color: #ffffff; display: block; }
        .inout-lbl { font-size: 0.7rem; color: #7aa0c0; }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem;
        }
        .cost-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; }
        .cost-stat { background: rgba(255,255,255,0.03); border-left: 4px solid; border-radius: 8px; padding: 0.5rem; text-align: center; }
        .cost-val { font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700; color: #ffffff; display: block; }
        .cost-lbl { font-size: 0.65rem; color: #7aa0c0; }
        @media (max-width: 768px) {
          .charts-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
