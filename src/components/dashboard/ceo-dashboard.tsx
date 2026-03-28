"use client";

import { useState, useEffect } from "react";

interface CEOData {
  gross_revenue?: number;
  total_expenses?: number;
  net_profit?: number;
  tax_liability?: number;
  revenue_breakdown?: Array<{ label: string; amount: number }>;
  expense_breakdown?: Array<{ label: string; amount: number }>;
  top_clients?: Array<{
    name: string;
    members: number;
    claims: number;
    revenue: number;
    loss_ratio: number;
  }>;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const fmtUsdFull = (n: number) =>
  "$" +
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n);

export function CEODashboard() {
  const [data, setData] = useState<CEOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ceoRes, finRes] = await Promise.all([
          fetch("/api/proxy/getCEODashboard").then((r) => r.json()),
          fetch("/api/proxy/getCEOFinancials").then((r) => r.json()),
        ]);

        const merged: CEOData = {};

        // From getCEODashboard
        if (ceoRes.summary) {
          merged.gross_revenue = ceoRes.summary.gross_revenue || 0;
          merged.total_expenses = ceoRes.summary.total_expenses || 0;
          merged.net_profit = ceoRes.summary.net_profit || 0;
          merged.tax_liability = ceoRes.summary.tax_liability || 0;
        }
        if (ceoRes.revenue_breakdown) merged.revenue_breakdown = ceoRes.revenue_breakdown;
        if (ceoRes.expense_breakdown) merged.expense_breakdown = ceoRes.expense_breakdown;
        if (ceoRes.top_clients) merged.top_clients = ceoRes.top_clients;

        // Fallbacks from getCEOFinancials
        if (finRes.data) {
          if (!merged.gross_revenue) merged.gross_revenue = finRes.data.gross_revenue || 0;
          if (!merged.total_expenses) merged.total_expenses = finRes.data.total_expenses || 0;
          if (!merged.net_profit) merged.net_profit = finRes.data.net_profit || 0;
          if (!merged.revenue_breakdown) merged.revenue_breakdown = finRes.data.revenue_breakdown;
          if (!merged.expense_breakdown) merged.expense_breakdown = finRes.data.expense_breakdown;
          if (!merged.top_clients) merged.top_clients = finRes.data.top_clients;
        }

        setData(merged);
      } catch (err) {
        console.error("CEO dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="section-polaris">
        <div className="section-divider-polaris">CEO/CFO FINANCIAL DASHBOARD</div>
        <div style={{ textAlign: "center", padding: "2rem", color: "#7aa0c0" }}>Loading financial data...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="section-polaris">
      <div className="section-divider-polaris">CEO/CFO FINANCIAL DASHBOARD</div>

      <h2 className="section-title-polaris" style={{ marginTop: "1rem" }}>
        Cyprus Financial Overview
      </h2>
      <p className="section-subtitle">Polaris Financial Services Ltd • Tax Jurisdiction: Cyprus (12.5% CIT)</p>

      {/* KPI Cards */}
      <div className="ceo-kpi-grid">
        <div className="ceo-kpi" style={{ borderLeftColor: "#D4AF37" }}>
          <div className="ceo-kpi-icon">💰</div>
          <div className="ceo-kpi-value" style={{ color: "#D4AF37" }}>
            {fmtUsdFull(data.gross_revenue || 0)}
          </div>
          <div className="ceo-kpi-label">GROSS REVENUE</div>
          <div className="ceo-kpi-sub">Premiums + Admin Fees</div>
        </div>
        <div className="ceo-kpi" style={{ borderLeftColor: "#e74c3c" }}>
          <div className="ceo-kpi-icon">📊</div>
          <div className="ceo-kpi-value" style={{ color: "#e74c3c" }}>
            {fmtUsdFull(data.total_expenses || 0)}
          </div>
          <div className="ceo-kpi-label">TOTAL EXPENSES</div>
          <div className="ceo-kpi-sub">Claims + Operating Costs</div>
        </div>
        <div className="ceo-kpi" style={{ borderLeftColor: "#2ecc71" }}>
          <div className="ceo-kpi-icon">📈</div>
          <div className="ceo-kpi-value" style={{ color: "#2ecc71" }}>
            {fmtUsdFull(data.net_profit || 0)}
          </div>
          <div className="ceo-kpi-label">NET PROFIT</div>
          <div className="ceo-kpi-sub">Before Tax (EBIT)</div>
        </div>
        <div className="ceo-kpi" style={{ borderLeftColor: "#9b59b6" }}>
          <div className="ceo-kpi-icon">🏛️</div>
          <div className="ceo-kpi-value" style={{ color: "#9b59b6" }}>
            {fmtUsdFull(data.tax_liability || 0)}
          </div>
          <div className="ceo-kpi-label">TAX LIABILITY</div>
          <div className="ceo-kpi-sub">Cyprus CIT @ 12.5%</div>
        </div>
      </div>

      {/* Revenue + Expense breakdowns */}
      <div className="ceo-breakdown-grid">
        {data.revenue_breakdown && (
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">📊 Revenue Breakdown</h3>
            {data.revenue_breakdown.map((item) => (
              <div key={item.label} className="breakdown-row">
                <span className="breakdown-label">{item.label}</span>
                <span className="breakdown-value" style={{ color: "#2ecc71" }}>
                  {fmtUsdFull(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.expense_breakdown && (
          <div className="chart-card-polaris">
            <h3 className="chart-title-polaris">💸 Expense Breakdown</h3>
            {data.expense_breakdown.map((item) => (
              <div key={item.label} className="breakdown-row">
                <span className="breakdown-label">{item.label}</span>
                <span className="breakdown-value" style={{ color: "#e74c3c" }}>
                  -{fmtUsdFull(Math.abs(item.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Clients by Revenue */}
      {data.top_clients && data.top_clients.length > 0 && (
        <div className="chart-card-polaris" style={{ marginTop: "1rem" }}>
          <h3 className="chart-title-polaris">🏆 Top Clients by Revenue</h3>
          <div className="tc-table-wrapper">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Members</th>
                  <th>Claims</th>
                  <th>Est. Revenue</th>
                  <th>Loss Ratio</th>
                </tr>
              </thead>
              <tbody>
                {data.top_clients.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td>{fmt(c.members)}</td>
                    <td>{fmtUsd(c.claims)}</td>
                    <td style={{ color: "#D4AF37" }}>{fmtUsd(c.revenue)}</td>
                    <td>
                      <span
                        style={{
                          color: c.loss_ratio > 75 ? "#e74c3c" : c.loss_ratio > 60 ? "#f39c12" : "#2ecc71",
                          fontWeight: 700,
                        }}
                      >
                        {c.loss_ratio}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .section-polaris { margin-bottom: 2rem; }
        .section-divider-polaris {
          text-align: center; padding: 1rem 0; font-family: "Montserrat", sans-serif;
          font-size: 0.85rem; font-weight: 800; letter-spacing: 3px;
          color: rgba(184, 212, 232, 0.5); margin-bottom: 0.5rem;
        }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 1.1rem; font-weight: 700;
          color: #ffffff; margin-bottom: 0.25rem;
        }
        .section-subtitle { font-size: 0.8rem; color: #7aa0c0; margin-bottom: 1.25rem; }
        .ceo-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .ceo-kpi {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-left: 4px solid; border-radius: 16px;
          padding: 1.25rem; text-align: center;
        }
        .ceo-kpi-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .ceo-kpi-value { font-family: "Montserrat", sans-serif; font-size: 1.5rem; font-weight: 800; }
        .ceo-kpi-label { font-size: 0.7rem; color: #7aa0c0; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .ceo-kpi-sub { font-size: 0.7rem; color: rgba(122, 160, 192, 0.5); margin-top: 0.15rem; }
        .ceo-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .chart-card-polaris {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem;
        }
        .chart-title-polaris {
          font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700;
          color: #ffffff; margin-bottom: 1rem;
        }
        .breakdown-row {
          display: flex; justify-content: space-between; padding: 0.6rem 0;
          border-bottom: 1px solid rgba(45, 80, 112, 0.2); font-size: 0.85rem;
        }
        .breakdown-label { color: #b8d4e8; }
        .breakdown-value { font-weight: 700; }
        .tc-table-wrapper { overflow-x: auto; }
        .tc-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .tc-table th {
          text-align: left; padding: 0.75rem 0.5rem; color: #7aa0c0;
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid #2d5070;
        }
        .tc-table td {
          padding: 0.75rem 0.5rem; color: #b8d4e8;
          border-bottom: 1px solid rgba(45, 80, 112, 0.2);
        }
        .tc-table tr:hover td { background: rgba(212, 175, 55, 0.05); }
        @media (max-width: 768px) {
          .ceo-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .ceo-breakdown-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
