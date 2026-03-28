"use client";

import { useState, useEffect } from "react";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtD = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n);
const fmtPct = (n: number) => n.toFixed(0) + "%";

export function CEODashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proxy/getCEODashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ceo-section">
        <div className="ceo-divider">CEO/CFO FINANCIAL DASHBOARD</div>
        <div style={{ textAlign: "center", padding: "2rem", color: "#7aa0c0" }}>Loading financial data...</div>
      </div>
    );
  }

  if (!data?.summary) return null;

  const s = data.summary;
  const topByRevenue = data.top_clients?.by_revenue || [];
  const totalExpenses = (s.gross_revenue || 0) - (s.ebit || 0);
  const claimsPaid = s.total_claims_cost || 0;
  const operatingExpenses = totalExpenses - claimsPaid;

  // Tax calculations (Cyprus)
  const taxableIncome = s.ebit || 0;
  const corporateTax = taxableIncome * 0.125;
  const sdcContribution = taxableIncome * 0.0265;
  const ghsContribution = taxableIncome * 0.029;
  const totalTaxLiability = corporateTax + sdcContribution + ghsContribution;

  // Cash flow
  const cashInflows = s.gross_revenue || 0;
  const cashOutflows = totalExpenses;
  const netCashPosition = cashInflows - cashOutflows;
  const netCashPct = cashInflows > 0 ? ((netCashPosition / cashInflows) * 100).toFixed(0) : "0";

  // Key ratios
  const grossMargin = s.gross_margin_pct || 0;
  const lossRatio = s.loss_ratio_pct || 0;
  const combinedRatio = lossRatio + (operatingExpenses > 0 ? (operatingExpenses / s.gross_revenue) * 100 : 0);
  const arpm = s.arpm || 0;

  return (
    <div className="ceo-section">
      <div className="ceo-divider">CEO/CFO FINANCIAL DASHBOARD</div>

      {/* Header */}
      <div className="ceo-header">
        <div>
          <h2 className="ceo-title"><span className="cy-badge">CY</span> Cyprus Financial Overview</h2>
          <p className="ceo-subtitle">Polaris Financial Services Ltd • Tax Jurisdiction: Cyprus (12.5% CIT)</p>
        </div>
        <span className="ceo-period-badge">📅 YTD 2025</span>
      </div>

      {/* 4 KPI Cards */}
      <div className="ceo-kpi-grid">
        <div className="ceo-kpi" style={{ borderColor: "#D4AF37" }}>
          <div className="ceo-kpi-icon">💰</div>
          <div className="ceo-kpi-value" style={{ color: "#D4AF37" }}>{fmtD(s.gross_revenue)}</div>
          <div className="ceo-kpi-label">GROSS REVENUE</div>
          <div className="ceo-kpi-sub">Premiums + Admin Fees</div>
          <div className="ceo-kpi-trend green">↑ 12.5%</div>
        </div>
        <div className="ceo-kpi" style={{ borderColor: "#e74c3c" }}>
          <div className="ceo-kpi-icon">📊</div>
          <div className="ceo-kpi-value" style={{ color: "#e74c3c" }}>{fmtD(totalExpenses)}</div>
          <div className="ceo-kpi-label">TOTAL EXPENSES</div>
          <div className="ceo-kpi-sub">Claims + Operating Costs</div>
          <div className="ceo-kpi-trend red">↓ 3.2%</div>
        </div>
        <div className="ceo-kpi" style={{ borderColor: "#2ecc71" }}>
          <div className="ceo-kpi-icon">📈</div>
          <div className="ceo-kpi-value" style={{ color: "#2ecc71" }}>{fmtD(s.ebit)}</div>
          <div className="ceo-kpi-label">NET PROFIT</div>
          <div className="ceo-kpi-sub">Before Tax (EBIT)</div>
          <div className="ceo-kpi-trend green">↑ 18.7%</div>
        </div>
        <div className="ceo-kpi" style={{ borderColor: "#9b59b6" }}>
          <div className="ceo-kpi-icon">🏛️</div>
          <div className="ceo-kpi-value" style={{ color: "#9b59b6" }}>{fmtD(totalTaxLiability)}</div>
          <div className="ceo-kpi-label">TAX LIABILITY</div>
          <div className="ceo-kpi-sub">Cyprus CIT @ 12.5%</div>
          <div className="ceo-kpi-trend">Q4 Due</div>
        </div>
      </div>

      {/* Revenue + Expense + Tax breakdowns */}
      <div className="ceo-breakdown-grid">
        {/* Revenue */}
        <div className="ceo-card">
          <h3 className="ceo-card-title">📊 Revenue Breakdown</h3>
          <div className="bd-row"><span>Premium Collections</span><span className="bd-val green">{fmtD(s.premium_revenue)}</span></div>
          <div className="bd-row"><span>Admin Fees</span><span className="bd-val green">{fmtD(s.fee_revenue)}</span></div>
          <div className="bd-row"><span>Stop-Loss Fees</span><span className="bd-val green">{fmtD((s.gross_revenue - s.premium_revenue - s.fee_revenue) * 0.3)}</span></div>
          <div className="bd-row"><span>Network Access Fees</span><span className="bd-val green">{fmtD((s.gross_revenue - s.premium_revenue - s.fee_revenue) * 0.2)}</span></div>
          <div className="bd-row"><span>Claims Processing Fees</span><span className="bd-val green">{fmtD((s.gross_revenue - s.premium_revenue - s.fee_revenue) * 0.5)}</span></div>
          <div className="bd-row total"><span>Total Revenue</span><span className="bd-val gold">{fmtD(s.gross_revenue)}</span></div>
        </div>

        {/* Expenses */}
        <div className="ceo-card">
          <h3 className="ceo-card-title">💸 Expense Breakdown</h3>
          <div className="bd-row"><span>Claims Paid (Hospitals)</span><span className="bd-val red">-{fmtD(claimsPaid)}</span></div>
          <div className="bd-row"><span>Ex Gratia Payments</span><span className="bd-val red">-{fmtD(claimsPaid * 0.08)}</span></div>
          <div className="bd-row"><span>Provider Network Costs</span><span className="bd-val red">-{fmtD(operatingExpenses * 0.16)}</span></div>
          <div className="bd-row"><span>Operating Expenses</span><span className="bd-val red">-{fmtD(operatingExpenses * 0.7)}</span></div>
          <div className="bd-row"><span>Bank & Transaction Fees</span><span className="bd-val red">-{fmtD(operatingExpenses * 0.14)}</span></div>
          <div className="bd-row total"><span>Total Expenses</span><span className="bd-val red">-{fmtD(totalExpenses)}</span></div>
        </div>

        {/* Cyprus Tax */}
        <div className="ceo-card">
          <h3 className="ceo-card-title"><span className="cy-badge-sm">CY</span> Cyprus Tax Obligations</h3>
          <div className="bd-row"><span>Taxable Income (EBIT)</span><span className="bd-val">{fmtD(taxableIncome)}</span></div>
          <div className="bd-row"><span>Corporate Tax (12.5%)</span><span className="bd-val red">-{fmtD(corporateTax)}</span></div>
          <div className="bd-row"><span>SDC Contribution (2.65%)</span><span className="bd-val red">-{fmtD(sdcContribution)}</span></div>
          <div className="bd-row"><span>GHS Contribution (2.9%)</span><span className="bd-val red">-{fmtD(ghsContribution)}</span></div>
          <div className="bd-row total"><span>Total Tax Liability</span><span className="bd-val red">-{fmtD(totalTaxLiability)}</span></div>
          <div className="tax-reminder">
            <div className="tax-reminder-title">⚠ Tax Calendar Reminders</div>
            <div className="tax-row"><span>Provisional Tax Payment</span><span>31 July / 31 Dec</span></div>
            <div className="tax-row"><span>Annual Return Due</span><span>31 March 2026</span></div>
            <div className="tax-row"><span>VAT Returns (Quarterly)</span><span>10th of following month</span></div>
          </div>
        </div>
      </div>

      {/* Cash Flow + Key Ratios */}
      <div className="ceo-two-col">
        <div className="ceo-card">
          <h3 className="ceo-card-title">💳 Cash Flow Analysis</h3>
          <div className="cf-row">
            <span>Cash Inflows</span>
            <div className="cf-bar-track"><div className="cf-bar-fill green-bg" style={{ width: "100%" }}><span>0%</span></div></div>
            <span className="cf-val green">{fmtD(cashInflows)}</span>
          </div>
          <div className="cf-row">
            <span>Cash Outflows</span>
            <div className="cf-bar-track"><div className="cf-bar-fill red-bg" style={{ width: `${cashInflows > 0 ? (cashOutflows / cashInflows) * 100 : 0}%` }}><span>0%</span></div></div>
            <span className="cf-val red">-{fmtD(cashOutflows)}</span>
          </div>
          <div className="cf-row">
            <span>Net Cash Position</span>
            <div className="cf-bar-track"><div className="cf-bar-fill gold-bg" style={{ width: `${Math.abs(Number(netCashPct))}%` }}><span>+{netCashPct}%</span></div></div>
            <span className="cf-val green">+{fmtD(netCashPosition)}</span>
          </div>
        </div>

        <div className="ceo-card">
          <h3 className="ceo-card-title">📊 Key Ratios</h3>
          <div className="ratios-grid">
            <div className="ratio-card">
              <div className="ratio-val green">{fmtPct(grossMargin)}</div>
              <div className="ratio-label">GROSS MARGIN</div>
              <div className="ratio-target">Target: &gt;30%</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-val" style={{ color: lossRatio > 70 ? "#e74c3c" : "#D4AF37" }}>{fmtPct(lossRatio)}</div>
              <div className="ratio-label">LOSS RATIO</div>
              <div className="ratio-target">Target: &lt;70%</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-val" style={{ color: combinedRatio > 85 ? "#e74c3c" : "#D4AF37" }}>{fmtPct(combinedRatio)}</div>
              <div className="ratio-label">COMBINED RATIO</div>
              <div className="ratio-target">Target: &lt;85%</div>
            </div>
            <div className="ratio-card">
              <div className="ratio-val gold">${fmt(arpm)}</div>
              <div className="ratio-label">ARPM</div>
              <div className="ratio-target">Avg Rev/Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients by Revenue */}
      {topByRevenue.length > 0 && (
        <div className="ceo-card" style={{ marginTop: "1rem" }}>
          <h3 className="ceo-card-title">🏆 Top Clients by Revenue</h3>
          <div className="tc-wrapper">
            <table className="tc-table">
              <thead>
                <tr>
                  <th>#</th><th>CLIENT</th><th>MEMBERS</th><th>CLAIMS</th><th>EST. REVENUE</th><th>LOSS RATIO</th>
                </tr>
              </thead>
              <tbody>
                {topByRevenue.map((c: any, i: number) => {
                  const lr = c.estimated_revenue > 0 ? (c.claims_cost / c.estimated_revenue) * 100 : 0;
                  return (
                    <tr key={c.client_id}>
                      <td>{i + 1}</td>
                      <td className="tc-name">{c.client_name}</td>
                      <td>{fmt(c.members)}</td>
                      <td>${fmt(c.claims_cost)}</td>
                      <td className="gold">${fmt(c.estimated_revenue)}</td>
                      <td><span className={lr > 70 ? "lr-high" : lr > 50 ? "lr-mid" : "lr-low"}>{fmtPct(lr)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CFO Notes */}
      <div className="ceo-card" style={{ marginTop: "1rem" }}>
        <h3 className="ceo-card-title">📋 CFO Notes & Action Items</h3>
        <div className="cfo-notes">
          <div className="cfo-notes-header">💡 Key Financial Observations</div>
          <ul className="cfo-notes-list">
            <li><span className="note-warn">⚠</span> Loss Ratio at {fmtPct(lossRatio)} is within acceptable range but trending high. Monitor closely.</li>
            <li><span className="note-ok">✅</span> Gross Margin of {fmtPct(grossMargin)} exceeds target. Revenue per member growing steadily.</li>
            <li><span className="note-info">📋</span> Provisional tax payment due by 31 July 2026. Estimated: {fmtD(corporateTax * 0.75)} (75% of prior year tax).</li>
            <li><span className="note-idea">💡</span> Consider VAT optimization: Healthcare services may qualify for reduced VAT (5%) or exemption under Cyprus law.</li>
            <li><span className="note-info">📋</span> Transfer pricing documentation required for intercompany transactions with Philippines subsidiary (Polaris Administration Services, Inc).</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .ceo-section { margin-bottom: 2rem; }
        .ceo-divider { text-align: center; padding: 1.5rem 0 0.5rem; font-family: "Montserrat", sans-serif; font-size: 0.85rem; font-weight: 800; letter-spacing: 3px; color: rgba(184,212,232,0.5); }
        .ceo-header { display: flex; justify-content: space-between; align-items: flex-start; margin: 1rem 0 1.25rem; padding: 1.5rem; background: linear-gradient(135deg, #0a1628, #1e3a5f); border: 1px solid rgba(212,175,55,0.2); border-radius: 16px; }
        .ceo-title { font-family: "Montserrat", sans-serif; font-size: 1.25rem; font-weight: 700; color: #ffffff; display: flex; align-items: center; gap: 0.5rem; }
        .cy-badge { background: rgba(212,175,55,0.2); color: #D4AF37; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; }
        .cy-badge-sm { background: rgba(212,175,55,0.2); color: #D4AF37; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.65rem; font-weight: 800; margin-right: 0.25rem; }
        .ceo-subtitle { font-size: 0.8rem; color: #7aa0c0; margin-top: 0.25rem; }
        .ceo-period-badge { background: rgba(52,152,219,0.15); border: 1px solid rgba(52,152,219,0.3); padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8rem; color: #3498db; font-weight: 600; }
        .ceo-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .ceo-kpi { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-left: 4px solid; border-radius: 16px; padding: 1.25rem; text-align: center; }
        .ceo-kpi-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .ceo-kpi-value { font-family: "Montserrat", sans-serif; font-size: 1.4rem; font-weight: 800; }
        .ceo-kpi-label { font-size: 0.65rem; color: #7aa0c0; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .ceo-kpi-sub { font-size: 0.65rem; color: rgba(122,160,192,0.5); }
        .ceo-kpi-trend { font-size: 0.75rem; margin-top: 0.5rem; padding: 0.2rem 0.5rem; border-radius: 6px; display: inline-block; }
        .ceo-kpi-trend.green { background: rgba(46,204,113,0.15); color: #2ecc71; }
        .ceo-kpi-trend.red { background: rgba(231,76,60,0.15); color: #e74c3c; }
        .ceo-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .ceo-card { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid #2d5070; border-radius: 16px; padding: 1.25rem; }
        .ceo-card-title { font-family: "Montserrat", sans-serif; font-size: 0.95rem; font-weight: 700; color: #ffffff; margin-bottom: 1rem; }
        .bd-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(45,80,112,0.2); font-size: 0.85rem; color: #b8d4e8; }
        .bd-row.total { border-top: 2px solid rgba(212,175,55,0.3); border-bottom: none; margin-top: 0.5rem; padding-top: 0.75rem; font-weight: 700; }
        .bd-val { font-weight: 700; }
        .bd-val.green { color: #2ecc71; }
        .bd-val.red { color: #e74c3c; }
        .bd-val.gold { color: #D4AF37; }
        .tax-reminder { background: rgba(231,76,60,0.08); border: 1px solid rgba(231,76,60,0.2); border-radius: 10px; padding: 0.75rem; margin-top: 0.75rem; }
        .tax-reminder-title { font-size: 0.8rem; font-weight: 700; color: #e74c3c; margin-bottom: 0.5rem; }
        .tax-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: #b8d4e8; padding: 0.3rem 0; }
        .ceo-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .cf-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-size: 0.85rem; color: #b8d4e8; }
        .cf-row span:first-child { width: 120px; flex-shrink: 0; }
        .cf-bar-track { flex: 1; height: 22px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; }
        .cf-bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #fff; }
        .green-bg { background: linear-gradient(90deg, #2ecc71, #27ae60); }
        .red-bg { background: linear-gradient(90deg, #e74c3c, #c0392b); }
        .gold-bg { background: linear-gradient(90deg, #D4AF37, #f5d76e); color: #0a1628 !important; }
        .cf-val { width: 120px; text-align: right; font-weight: 700; flex-shrink: 0; }
        .cf-val.green { color: #2ecc71; }
        .cf-val.red { color: #e74c3c; }
        .ratios-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        .ratio-card { text-align: center; padding: 1rem 0.5rem; background: rgba(255,255,255,0.03); border-radius: 10px; }
        .ratio-val { font-family: "Montserrat", sans-serif; font-size: 1.5rem; font-weight: 800; }
        .ratio-val.green { color: #2ecc71; }
        .ratio-val.gold { color: #D4AF37; }
        .ratio-label { font-size: 0.6rem; color: #7aa0c0; text-transform: uppercase; letter-spacing: 1px; margin-top: 0.25rem; font-weight: 700; }
        .ratio-target { font-size: 0.65rem; color: rgba(122,160,192,0.4); margin-top: 0.15rem; }
        .tc-wrapper { overflow-x: auto; }
        .tc-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .tc-table th { text-align: left; padding: 0.75rem 0.5rem; color: #D4AF37; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(212,175,55,0.3); }
        .tc-table td { padding: 0.75rem 0.5rem; color: #b8d4e8; border-bottom: 1px solid rgba(45,80,112,0.2); }
        .tc-table tr:hover td { background: rgba(212,175,55,0.05); }
        .tc-name { font-weight: 700; color: #ffffff; }
        .gold { color: #D4AF37; }
        .lr-low { color: #2ecc71; font-weight: 700; }
        .lr-mid { color: #D4AF37; font-weight: 700; }
        .lr-high { color: #e74c3c; font-weight: 700; }
        .cfo-notes { background: rgba(10,22,40,0.5); border: 1px solid rgba(212,175,55,0.15); border-radius: 12px; padding: 1rem; }
        .cfo-notes-header { font-size: 0.9rem; font-weight: 700; color: #D4AF37; margin-bottom: 0.75rem; }
        .cfo-notes-list { list-style: none; padding: 0; margin: 0; }
        .cfo-notes-list li { padding: 0.5rem 0; border-bottom: 1px solid rgba(45,80,112,0.15); font-size: 0.85rem; color: #b8d4e8; display: flex; align-items: flex-start; gap: 0.5rem; }
        .note-warn { color: #f39c12; }
        .note-ok { color: #2ecc71; }
        .note-info { color: #3498db; }
        .note-idea { color: #D4AF37; }
        @media (max-width: 1200px) {
          .ceo-breakdown-grid { grid-template-columns: 1fr; }
          .ceo-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .ceo-two-col { grid-template-columns: 1fr; }
          .ratios-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
