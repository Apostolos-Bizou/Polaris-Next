"use client";

import type { DashboardStats } from "@/hooks/use-dashboard";

interface StatsBarProps {
  stats: DashboardStats | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Active Clients", value: stats?.active_clients, icon: "🏢" },
    { label: "Open Offers", value: stats?.open_offers, icon: "📝" },
    { label: "Active Contracts", value: stats?.active_contracts, icon: "📋" },
    { label: "Total Members", value: stats?.total_members, icon: "👥" },
    { label: "Pending Signatures", value: stats?.pending_signatures, icon: "✍️" },
  ];

  return (
    <div className="stats-bar-polaris">
      {items.map((item) => (
        <div key={item.label} className="stats-bar-item">
          <div className="stats-bar-value">
            {item.value !== undefined
              ? new Intl.NumberFormat("en-US").format(item.value)
              : "--"}
          </div>
          <div className="stats-bar-label">
            {item.icon} {item.label}
          </div>
        </div>
      ))}

      <style jsx>{`
        .stats-bar-polaris {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, #0a1628, #1e3a5f);
          border-radius: 16px;
          border: 1px solid rgba(212, 175, 55, 0.15);
          margin-bottom: 1.5rem;
        }
        .stats-bar-item {
          text-align: center;
        }
        .stats-bar-value {
          font-family: "Montserrat", sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #d4af37;
        }
        .stats-bar-label {
          font-size: 0.75rem;
          color: rgba(184, 212, 232, 0.7);
          margin-top: 0.25rem;
        }
        @media (max-width: 768px) {
          .stats-bar-polaris {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 480px) {
          .stats-bar-polaris {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
