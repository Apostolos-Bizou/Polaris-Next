"use client";

import type { KPIData } from "@/hooks/use-dashboard";

interface KpiGridProps {
  kpis: KPIData;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

export function KpiGrid({ kpis }: KpiGridProps) {
  const costPerMember =
    kpis.total_members > 0 ? kpis.total_cost_usd / kpis.total_members : 0;
  const utilization =
    kpis.total_members > 0
      ? ((kpis.total_claims / kpis.total_members) * 100).toFixed(1) + "%"
      : "0%";

  const cards = [
    {
      icon: "👥",
      label: "Total Members",
      value: fmt(kpis.total_members),
      color: "#3498db",
    },
    {
      icon: "📋",
      label: "Total Claims",
      value: fmt(kpis.total_claims),
      color: "#e67e22",
    },
    {
      icon: "💵",
      label: "Approved Amount",
      value: fmtUsd(kpis.total_cost_usd),
      color: "#2ecc71",
    },
    {
      icon: "📈",
      label: "Cost per Member",
      value: fmtUsd(costPerMember),
      color: "#9b59b6",
    },
    {
      icon: "🎯",
      label: "Utilization Rate",
      value: utilization,
      color: "#D4AF37",
    },
  ];

  return (
    <div className="kpi-grid-polaris">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card-polaris">
          <div className="kpi-card-icon">{card.icon}</div>
          <div className="kpi-card-label">{card.label}</div>
          <div className="kpi-card-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}

      <style jsx>{`
        .kpi-grid-polaris {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .kpi-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070;
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .kpi-card-polaris:hover {
          border-color: #D4AF37;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
          transform: translateY(-2px);
        }
        .kpi-card-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .kpi-card-label {
          font-size: 0.75rem;
          color: #7aa0c0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }
        .kpi-card-value {
          font-family: "Montserrat", sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
        }
        @media (max-width: 1200px) {
          .kpi-grid-polaris {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .kpi-grid-polaris {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
