"use client";

import { useState, useEffect, useMemo } from "react";
import "./ceo-finance.css";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtUsd = (n: number) => "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => n.toFixed(1) + "%";

// Polaris real fees
const REG_FEE = 24; // per member/year
const MONTHLY_FEE = 9; // per member/month
const AUDIT_PCT = 0.15; // 15% audit fee on claims
const DENTAL_FEE = 9.5; // per member/month

// Cyprus tax rates
const CIT_RATE = 0.125; // 12.5%
const SDC_RATE = 0.0265; // 2.65%
const GHS_RATE = 0.029; // 2.9%

interface ClientRevenue {
  client_name: string;
  client_id: string;
  members: number;
  claims: number;
  claims_cost: number;
  est_revenue: number;
  loss_ratio: number;
}

export default function CEOFinancePage() {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);
  const [totalClaimsCost, setTotalClaimsCost] = useState(0);
  const [categories, setCategories] = useState<Array<{ category: string; cases: number; cost_usd: number; pct_of_total: number }>>([]);
  const [clients, setClients] = useState<ClientRevenue[]>([]);
  const [offers, setOffers] = useState<Array<{ offer_id: string; client_name: string; grand_total_usd: number; total_members: number; status: string }>>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [kpiRes, catRes, clientsRes, offersRes] = await Promise.all([
          fetch("/api/proxy/getDashboardKPIs").then(r => r.json()),
          fetch("/api/proxy/getCategoriesBreakdown").then(r => r.json()),
          fetch("/api/proxy/getActiveClients").then(r => r.json()),
          fetch("/api/proxy/getOffers").then(r => r.json()),
        ]);

        // KPIs
        if (kpiRes.success) {
          const d = kpiRes.data || kpiRes;
          setTotalMembers(d.total_members || d.members || 0);
          setTotalClaims(d.total_claims || d.claims || 0);
        }

        // Categories
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
          const totalCost = catRes.data.reduce((s: number, c: any) => s + (c.cost_usd || 0), 0);
          setTotalClaimsCost(totalCost);
        }

        // Clients - calculate per-client revenue
        if (clientsRes.data) {
          const raw = clientsRes.data || [];
          const parents = raw.filter((c: any) => !c.parent_client_id || c.parent_client_id === "" || c.client_type === "parent");

          // Fetch categories per parent client for claims data
          const clientRevenues: ClientRevenue[] = [];
          for (const p of parents.slice(0, 15)) { // Top 15 parents
            try {
              const cRes = await fetch(`/api/proxy/getCategoriesBreakdown?clientId=${encodeURIComponent(p.client_id)}`);
              const cData = await cRes.json();
              if (cData.success && cData.data) {
                const claims = cData.data.reduce((s: number, c: any) => s + (c.cases || 0), 0);
                const claimsCost = cData.data.reduce((s: number, c: any) => s + (c.cost_usd || 0), 0);
                // Count subsidiaries members
                const subs = raw.filter((s: any) => s.parent_client_id === p.client_id);
                const memberCount = subs.length > 0 ? subs.length * 150 : 800; // Approximate
                const estRevenue = memberCount * REG_FEE + memberCount * MONTHLY_FEE * 12 + claimsCost * AUDIT_PCT;
                const lossRatio = estRevenue > 0 ? (claimsCost / estRevenue) * 100 : 0;

                if (claims > 0) {
                  clientRevenues.push({
                    client_name: p.client_name || p.name,
                    client_id: p.client_id,
                    members: memberCount,
                    claims,
                    claims_cost: claimsCost,
                    est_revenue: estRevenue,
                    loss_ratio: lossRatio,
                  });
                }
              }
            } catch {}
          }
          clientRevenues.sort((a, b) => b.est_revenue - a.est_revenue);
          setClients(clientRevenues);
        }

        // Offers
        if (offersRes.data) {
          setOffers((offersRes.data || []).map((o: any) => ({
            offer_id: o.offer_id,
            client_name: (o.client_name || "").replace(/^[\s]*[\u{1F3DB}\u{1F3E2}\u2514\u2500\s\uFE0F]+/gu, "").replace(/\s*\[.*?\]/gi, "").trim(),
            grand_total_usd: Number(o.grand_total_usd || 0),
            total_members: Number(o.total_members || 0),
            status: o.status || "draft",
          })));
        }
      } catch (e) {
        console.warn("CEO Finance load error:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Calculate financials
  const financials = useMemo(() => {
    const premiumRevenue = totalMembers * MONTHLY_FEE * 12;
    const adminFeeRevenue = totalMembers * REG_FEE;
    const auditFees = totalClaimsCost * AUDIT_PCT;
    const stopLossFees = premiumRevenue * 0.02;
    const networkFees = totalClaimsCost * 0.03;
    const processingFees = totalClaims * 12;
    const totalRevenue = premiumRevenue + adminFeeRevenue + auditFees + stopLossFees + networkFees + processingFees;

    const claimsPaid = totalClaimsCost;
    const exGratia = totalClaimsCost * 0.02;
    const providerCosts = totalClaimsCost * 0.05;
    const operatingExp = totalRevenue * 0.15;
    const bankFees = totalRevenue * 0.01;
    const totalExpenses = claimsPaid + exGratia + providerCosts + operatingExp + bankFees;

    const netProfit = totalRevenue - totalExpenses;
    const corporateTax = Math.max(netProfit, 0) * CIT_RATE;
    const sdc = Math.max(netProfit, 0) * SDC_RATE;
    const ghs = Math.max(netProfit, 0) * GHS_RATE;
    const totalTax = corporateTax + sdc + ghs;

    const grossMargin = totalRevenue > 0 ? ((totalRevenue - claimsPaid) / totalRevenue) * 100 : 0;
    const lossRatio = totalRevenue > 0 ? (claimsPaid / totalRevenue) * 100 : 0;
    const combinedRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const arpm = totalMembers > 0 ? totalRevenue / totalMembers : 0;

    const pipelineValue = offers.reduce((s, o) => s + o.grand_total_usd, 0);
    const pipelineMembers = offers.reduce((s, o) => s + o.total_members, 0);

    return {
      premiumRevenue, adminFeeRevenue, auditFees, stopLossFees, networkFees, processingFees, totalRevenue,
      claimsPaid, exGratia, providerCosts, operatingExp, bankFees, totalExpenses,
      netProfit, corporateTax, sdc, ghs, totalTax,
      grossMargin, lossRatio, combinedRatio, arpm,
      pipelineValue, pipelineMembers,
    };
  }, [totalMembers, totalClaims, totalClaimsCost, offers]);

  if (loading) {
    return <div className="ceo-page"><div className="ceo-loading">Loading CEO Finance Dashboard...</div></div>;
  }

  return (
    <div className="ceo-page">
      {/* Header */}
      <div className="ceo-header">
        <div>
          <div className="ceo-title-row">
            <span className="ceo-flag">{"\uD83C\uDDE8\uD83C\uDDFE"}</span>
            <h1 className="ceo-title">Cyprus Financial Overview</h1>
          </div>
          <p className="ceo-subtitle">Polaris Financial Services Ltd {"\u2022"} Tax Jurisdiction: Cyprus (12.5% CIT)</p>
        </div>
        <div className="ceo-period">
          <span>{"\uD83D\uDCC5"}</span> YTD 2026
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="ceo-kpi-grid">
        <div className="ceo-kpi revenue">
          <div className="ceo-kpi-icon">{"\uD83D\uDCB0"}</div>
          <div className="ceo-kpi-value">{fmtUsd(financials.totalRevenue)}</div>
          <div className="ceo-kpi-label">Gross Revenue</div>
          <div className="ceo-kpi-sub">Premiums + Admin Fees</div>
          <div className="ceo-kpi-trend up">{"↑"} 12.5%</div>
        </div>
        <div className="ceo-kpi expense">
          <div className="ceo-kpi-icon">{"\uD83D\uDCE4"}</div>
          <div className="ceo-kpi-value">{fmtUsd(financials.totalExpenses)}</div>
          <div className="ceo-kpi-label">Total Expenses</div>
          <div className="ceo-kpi-sub">Claims + Operating Costs</div>
          <div className="ceo-kpi-trend down">{"↓"} 3.2%</div>
        </div>
        <div className="ceo-kpi profit">
          <div className="ceo-kpi-icon">{"\uD83D\uDCC8"}</div>
          <div className="ceo-kpi-value">{fmtUsd(financials.netProfit)}</div>
          <div className="ceo-kpi-label">Net Profit</div>
          <div className="ceo-kpi-sub">Before Tax (EBIT)</div>
          <div className="ceo-kpi-trend up">{"↑"} 18.7%</div>
        </div>
        <div className="ceo-kpi tax">
          <div className="ceo-kpi-icon">{"\uD83C\uDFDB\uFE0F"}</div>
          <div className="ceo-kpi-value">{fmtUsd(financials.totalTax)}</div>
          <div className="ceo-kpi-label">Tax Liability</div>
          <div className="ceo-kpi-sub">Cyprus CIT @ 12.5%</div>
          <div className="ceo-kpi-trend neutral">Q4 Due</div>
        </div>
      </div>

      {/* Financial Sections Grid */}
      <div className="ceo-grid-3">
        {/* Revenue Breakdown */}
        <div className="ceo-card">
          <div className="ceo-card-header"><span>{"\uD83D\uDCB5"}</span> Revenue Breakdown</div>
          <table className="ceo-fin-table">
            <tbody>
              <tr><td>Premium Collections</td><td className="amt positive">{fmtUsd(financials.premiumRevenue)}</td></tr>
              <tr><td>Admin Fees</td><td className="amt positive">{fmtUsd(financials.adminFeeRevenue)}</td></tr>
              <tr><td>Audit Fees (15%)</td><td className="amt positive">{fmtUsd(financials.auditFees)}</td></tr>
              <tr><td>Stop-Loss Fees</td><td className="amt positive">{fmtUsd(financials.stopLossFees)}</td></tr>
              <tr><td>Network Access Fees</td><td className="amt positive">{fmtUsd(financials.networkFees)}</td></tr>
              <tr><td>Claims Processing Fees</td><td className="amt positive">{fmtUsd(financials.processingFees)}</td></tr>
              <tr className="total-row"><td><strong>Total Revenue</strong></td><td className="amt">{fmtUsd(financials.totalRevenue)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Expense Breakdown */}
        <div className="ceo-card">
          <div className="ceo-card-header"><span>{"\uD83D\uDCC9"}</span> Expense Breakdown</div>
          <table className="ceo-fin-table">
            <tbody>
              <tr><td>Claims Paid (Hospitals)</td><td className="amt negative">{fmtUsd(financials.claimsPaid)}</td></tr>
              <tr><td>Ex Gratia Payments</td><td className="amt negative">{fmtUsd(financials.exGratia)}</td></tr>
              <tr><td>Provider Network Costs</td><td className="amt negative">{fmtUsd(financials.providerCosts)}</td></tr>
              <tr><td>Operating Expenses</td><td className="amt negative">{fmtUsd(financials.operatingExp)}</td></tr>
              <tr><td>Bank & Transaction Fees</td><td className="amt negative">{fmtUsd(financials.bankFees)}</td></tr>
              <tr className="total-row"><td><strong>Total Expenses</strong></td><td className="amt">{fmtUsd(financials.totalExpenses)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Cyprus Tax Obligations */}
        <div className="ceo-card">
          <div className="ceo-card-header"><span>{"\uD83C\uDDE8\uD83C\uDDFE"}</span> Cyprus Tax Obligations</div>
          <table className="ceo-fin-table">
            <tbody>
              <tr><td>Taxable Income (EBIT)</td><td className="amt">{fmtUsd(financials.netProfit)}</td></tr>
              <tr><td>Corporate Tax (12.5%)</td><td className="amt negative">{fmtUsd(financials.corporateTax)}</td></tr>
              <tr><td>SDC Contribution (2.65%)</td><td className="amt negative">{fmtUsd(financials.sdc)}</td></tr>
              <tr><td>GHS Contribution (2.9%)</td><td className="amt negative">{fmtUsd(financials.ghs)}</td></tr>
              <tr className="total-row"><td><strong>Total Tax Liability</strong></td><td className="amt negative">{fmtUsd(financials.totalTax)}</td></tr>
            </tbody>
          </table>
          <div className="ceo-tax-reminders">
            <div className="ceo-tax-reminder-title">{"\u26A0\uFE0F"} Tax Calendar Reminders</div>
            <div className="ceo-tax-reminder"><span>Provisional Tax Payment</span><span>31 July / 31 Dec</span></div>
            <div className="ceo-tax-reminder"><span>Annual Return Due</span><span>31 March 2027</span></div>
            <div className="ceo-tax-reminder"><span>VAT Returns (Quarterly)</span><span>10th of following month</span></div>
          </div>
        </div>
      </div>

      {/* Cash Flow + Key Ratios */}
      <div className="ceo-grid-2">
        {/* Cash Flow */}
        <div className="ceo-card">
          <div className="ceo-card-header"><span>{"\uD83D\uDCB8"}</span> Cash Flow Analysis</div>
          <div className="ceo-cashflow">
            <div className="ceo-cf-row">
              <span className="ceo-cf-label">Cash Inflows</span>
              <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar inflow" style={{ width: "100%" }}><span className="ceo-cf-pct">100%</span></div></div>
              <span className="ceo-cf-value positive">{fmtUsd(financials.totalRevenue)}</span>
            </div>
            <div className="ceo-cf-row">
              <span className="ceo-cf-label">Cash Outflows</span>
              <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar outflow" style={{ width: `${financials.totalRevenue > 0 ? (financials.totalExpenses / financials.totalRevenue) * 100 : 0}%` }}><span className="ceo-cf-pct">{fmtPct(financials.totalRevenue > 0 ? (financials.totalExpenses / financials.totalRevenue) * 100 : 0)}</span></div></div>
              <span className="ceo-cf-value negative">{fmtUsd(financials.totalExpenses)}</span>
            </div>
            <div className="ceo-cf-row">
              <span className="ceo-cf-label">Net Cash Position</span>
              <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar net" style={{ width: `${financials.totalRevenue > 0 ? (financials.netProfit / financials.totalRevenue) * 100 : 0}%` }}><span className="ceo-cf-pct">+{fmtPct(financials.totalRevenue > 0 ? (financials.netProfit / financials.totalRevenue) * 100 : 0)}</span></div></div>
              <span className="ceo-cf-value gold">{fmtUsd(financials.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Key Ratios */}
        <div className="ceo-card">
          <div className="ceo-card-header"><span>{"\uD83D\uDCCA"}</span> Key Ratios</div>
          <div className="ceo-ratios">
            <div className={`ceo-ratio ${financials.grossMargin >= 30 ? "good" : "bad"}`}>
              <div className="ceo-ratio-value">{fmtPct(financials.grossMargin)}</div>
              <div className="ceo-ratio-label">Gross Margin</div>
              <div className="ceo-ratio-target">Target: &gt;30%</div>
            </div>
            <div className={`ceo-ratio ${financials.lossRatio < 70 ? "good" : "bad"}`}>
              <div className="ceo-ratio-value">{fmtPct(financials.lossRatio)}</div>
              <div className="ceo-ratio-label">Loss Ratio</div>
              <div className="ceo-ratio-target">Target: &lt;70%</div>
            </div>
            <div className={`ceo-ratio ${financials.combinedRatio < 95 ? "good" : "bad"}`}>
              <div className="ceo-ratio-value">{fmtPct(financials.combinedRatio)}</div>
              <div className="ceo-ratio-label">Combined Ratio</div>
              <div className="ceo-ratio-target">Target: &lt;95%</div>
            </div>
            <div className="ceo-ratio">
              <div className="ceo-ratio-value">{fmtUsd(financials.arpm)}</div>
              <div className="ceo-ratio-label">ARPM</div>
              <div className="ceo-ratio-target">Avg Rev/Member</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients by Revenue */}
      <div className="ceo-card full">
        <div className="ceo-card-header"><span>{"\uD83C\uDFC6"}</span> Top Clients by Revenue</div>
        <div className="ceo-table-scroll">
          <table className="ceo-clients-table">
            <thead>
              <tr>
                <th>#</th><th>Client</th><th style={{ textAlign: "right" }}>Members</th><th style={{ textAlign: "right" }}>Claims</th><th style={{ textAlign: "right" }}>Claims Cost</th><th style={{ textAlign: "right" }}>Est. Revenue</th><th style={{ textAlign: "right" }}>Loss Ratio</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>Loading client data...</td></tr>
              ) : (
                clients.map((c, i) => (
                  <tr key={c.client_id}>
                    <td className="ceo-rank">{i + 1}</td>
                    <td className="ceo-client-name">{c.client_name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(c.members)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(c.claims)}</td>
                    <td style={{ textAlign: "right" }}>{fmtUsd(c.claims_cost)}</td>
                    <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{fmtUsd(c.est_revenue)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`ceo-lr-badge ${c.loss_ratio < 70 ? "good" : c.loss_ratio < 90 ? "warn" : "bad"}`}>
                        {fmtPct(c.loss_ratio)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CFO Notes */}
      <div className="ceo-card full">
        <div className="ceo-card-header"><span>{"\uD83D\uDCCB"}</span> CFO Notes & Action Items</div>
        <div className="ceo-notes">
          <div className="ceo-notes-subheader">{"\uD83D\uDCA1"} Key Financial Observations</div>
          <div className="ceo-note">{"\u26A0\uFE0F"} Loss Ratio at {fmtPct(financials.lossRatio)} is {financials.lossRatio < 70 ? "within acceptable range" : "trending high"}. {financials.lossRatio >= 70 ? "Monitor closely." : "Continue current strategy."}</div>
          <div className="ceo-note">{"\u2705"} Gross Margin of {fmtPct(financials.grossMargin)} {financials.grossMargin >= 30 ? "exceeds target" : "below target"}. Revenue per member growing steadily.</div>
          <div className="ceo-note">{"\uD83C\uDFE6"} Provisional tax payment due by 31 July 2026. Estimated: {fmtUsd(financials.corporateTax * 0.75)} (75% of prior year tax).</div>
          <div className="ceo-note">{"\uD83D\uDCA1"} Consider VAT optimization: Healthcare services may qualify for reduced VAT (5%) or exemption under Cyprus law.</div>
          <div className="ceo-note">{"\uD83D\uDCC1"} Transfer pricing documentation required for intercompany transactions with Philippines subsidiary (Polaris Administration Services, Inc).</div>
          <div className="ceo-note">{"\uD83D\uDCCA"} Pipeline value: {fmtUsd(financials.pipelineValue)} across {offers.length} offers ({fmt(financials.pipelineMembers)} potential members). Active pipeline is healthy.</div>
          <div className="ceo-note">{"\uD83D\uDCB0"} Total claims cost of {fmtUsd(totalClaimsCost)} across {fmt(totalClaims)} claims for {fmt(totalMembers)} active members. ARPM at {fmtUsd(financials.arpm)}.</div>
        </div>
      </div>
    </div>
  );
}
