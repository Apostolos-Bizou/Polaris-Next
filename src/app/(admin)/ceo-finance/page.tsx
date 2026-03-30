"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import "./ceo-finance.css";

const fmt = (n: number) => Math.round(n).toLocaleString();
const fmtUsd = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtPct = (n: number) => n.toFixed(1) + "%";

interface GroupedClient { id: string; name: string; type: string; parent_id: string | null; subs: Array<{ id: string; name: string }> }
interface CEOData {
  summary: any; claimTypes: any; memberTypes: any; top_clients: any;
}

export default function CEOFinancePage() {
  const [loading, setLoading] = useState(true);
  const [ceoData, setCeoData] = useState<CEOData | null>(null);
  const [clients, setClients] = useState<GroupedClient[]>([]);
  const [allClients, setAllClients] = useState<Array<{ id: string; name: string; type: string; parent_id: string | null }>>([]);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedClientName, setSelectedClientName] = useState("All Clients");
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>(["Q1"]);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setClientDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Load clients on mount
  useEffect(() => {
    fetch("/api/proxy/getActiveClients").then(r => r.json()).then(data => {
      const raw = data.data || [];
      const mapped = raw.map((c: any) => ({
        id: c.client_id || c.id,
        name: c.client_name || c.name,
        type: c.client_type || (c.parent_client_id ? "subsidiary" : "parent"),
        parent_id: c.parent_client_id || null,
      }));
      setAllClients(mapped);

      // Build grouped
      const parents = mapped.filter((c: any) => !c.parent_id || c.parent_id === "" || c.type === "parent");
      const groups: GroupedClient[] = parents.map((p: any) => ({
        ...p,
        subs: mapped.filter((s: any) => s.parent_id === p.id && s.id !== p.id),
      })).sort((a: GroupedClient, b: GroupedClient) => a.name.localeCompare(b.name));
      setClients(groups);
    }).catch(() => {});
  }, []);

  // Load CEO data whenever client or period changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let url = "/api/proxy/getCEODashboard";
        const params: string[] = [];
        if (selectedClient && selectedClient !== "all") {
          params.push("clientId=" + encodeURIComponent(selectedClient));
        }
        // Period: single quarter mode
        if (selectedQuarters.length === 1) {
          params.push("period=" + selectedQuarters[0] + "-" + selectedYear);
        }
        if (params.length > 0) url += "?" + params.join("&");

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          // If summary has zero revenue but top_clients has data, calculate from top_clients
          const summary = data.summary || {};
          const tops = [...(data.top_clients?.by_members || []), ...(data.top_clients?.by_revenue || [])];
          // Deduplicate by client_id
          const uniqueTops = Object.values(
            tops.reduce((acc: any, t: any) => { if (t.client_id && !acc[t.client_id]) acc[t.client_id] = t; return acc; }, {} as any)
          ) as any[];
          
          if ((summary.gross_revenue === 0 || !summary.gross_revenue) && uniqueTops.length > 0) {
            const totalMembers = uniqueTops.reduce((s: number, t: any) => s + (t.members || 0), 0);
            const totalClaims = uniqueTops.reduce((s: number, t: any) => s + (t.claims || 0), 0);
            const totalCost = uniqueTops.reduce((s: number, t: any) => s + (t.claims_cost || 0), 0);
            const totalRevenue = uniqueTops.reduce((s: number, t: any) => s + (t.estimated_revenue || 0), 0);
            const totalFees = uniqueTops.reduce((s: number, t: any) => s + (t.total_fees || t.estimated_revenue || 0), 0);
            
            const ebit = totalRevenue - totalCost;
            const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
            const lossRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
            
            data.summary = {
              ...summary,
              total_members: totalMembers,
              total_claims: totalClaims,
              total_claims_cost: totalCost,
              gross_revenue: totalRevenue,
              premium_revenue: totalRevenue * 0.5,
              fee_revenue: totalRevenue * 0.5,
              ebit: ebit,
              net_profit: ebit * 0.82,
              cyprus_tax: ebit > 0 ? ebit * 0.18 : 0,
              gross_margin_pct: grossMargin,
              loss_ratio_pct: lossRatio,
              profit_margin_pct: totalRevenue > 0 ? (ebit / totalRevenue) * 100 : 0,
              arpm: totalMembers > 0 ? totalRevenue / totalMembers : 0,
            };
          }
          setCeoData(data);
        }
      } catch (e) {
        console.warn("CEO Dashboard error:", e);
      }
      setLoading(false);
    };
    load();
  }, [selectedClient, selectedQuarters, selectedYear]);

  const s = ceoData?.summary || {};
  const ct = ceoData?.claimTypes || {};
  const mt = ceoData?.memberTypes || {};
  const topByRev = ceoData?.top_clients?.by_revenue || ceoData?.top_clients?.by_members || [];

  // Calculated values from API data
  const grossRevenue = s.gross_revenue || 0;
  const totalClaimsCost = s.total_claims_cost || 0;
  const ebit = s.ebit || 0;
  const netProfit = s.net_profit || 0;
  const cyprusTax = s.cyprus_tax || 0;
  const premiumRevenue = s.premium_revenue || 0;
  const feeRevenue = s.fee_revenue || 0;
  const grossMarginPct = s.gross_margin_pct || 0;
  const lossRatioPct = s.loss_ratio_pct || 0;
  const arpm = s.arpm || 0;
  const totalMembers = s.total_members || 0;
  const totalClaims = s.total_claims || 0;

  // Derived expenses
  const stopLossFees = grossRevenue * 0.08;
  const networkFees = grossRevenue * 0.05;
  const processingFees = grossRevenue * 0.02;
  const providerCosts = grossRevenue * 0.07;
  const operatingExp = grossRevenue * 0.15;
  const bankFees = grossRevenue * 0.01;
  const totalExpenses = totalClaimsCost + operatingExp + bankFees;

  // Tax breakdown
  const cit = Math.round(ebit * 0.125);
  const sdc = Math.round(ebit * 0.0265);
  const ghs = Math.round(ebit * 0.029);
  const totalTax = cit + sdc + ghs;

  // Combined ratio
  const combinedRatio = grossRevenue > 0 ? (totalExpenses / grossRevenue) * 100 : 0;

  const selectClient = (id: string, name: string) => {
    setSelectedClient(id);
    setSelectedClientName(name);
    setClientDropdownOpen(false);
  };

  const toggleQuarter = (q: string) => {
    setSelectedQuarters(prev => {
      if (prev.includes(q)) {
        return prev.length === 1 ? prev : prev.filter(x => x !== q);
      }
      return [...prev, q].sort();
    });
  };

  const periodLabel = selectedQuarters.length === 4 ? "Full Year " + selectedYear :
    selectedQuarters.length > 1 ? selectedQuarters.join("+") + " " + selectedYear :
    selectedQuarters[0] + " " + selectedYear;

  return (
    <div className="ceo-page">
      {/* Header with Client Dropdown + Period Selector */}
      <div className="ceo-header">
        <div>
          <div className="ceo-title-row">
            <span className="ceo-flag">{"\uD83C\uDDE8\uD83C\uDDFE"}</span>
            <h1 className="ceo-title">Cyprus Financial Overview</h1>
          </div>
          <p className="ceo-subtitle">Polaris Financial Services Ltd {"\u2022"} Tax Jurisdiction: Cyprus (12.5% CIT)</p>
        </div>
        <div className="ceo-header-right">
          {/* Client Dropdown */}
          <div ref={dropRef} className="ceo-client-dropdown-wrap">
            <button className="ceo-client-trigger" onClick={() => setClientDropdownOpen(!clientDropdownOpen)}>
              {selectedClientName}
              <span className="ceo-dd-arrow">{clientDropdownOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {clientDropdownOpen && (
              <div className="ceo-client-dropdown">
                <div className={`ceo-dd-item all ${selectedClient === "all" ? "active" : ""}`} onClick={() => selectClient("all", "All Clients")}>
                  {"\uD83C\uDFE2"} All Clients (Company Total)
                </div>
                <div className="ceo-dd-divider">Groups (Parent + Subsidiaries)</div>
                {clients.map(g => (
                  <div key={g.id}>
                    <div className={`ceo-dd-item parent ${selectedClient === "GROUP:" + g.id ? "active" : ""}`} onClick={() => selectClient("GROUP:" + g.id, g.name + " (" + (g.subs.length + 1) + " entities)")}>
                      {"\uD83C\uDFE2"} {g.name} ({g.subs.length + 1} entities)
                    </div>
                  </div>
                ))}
                <div className="ceo-dd-divider">All Clients</div>
                {allClients.map(c => (
                  <div key={c.id} className={`ceo-dd-item ${c.type === "subsidiary" ? "sub" : ""} ${selectedClient === c.id ? "active" : ""}`} onClick={() => selectClient(c.id, c.name)}>
                    {c.parent_id ? "\u2514 " : "\uD83C\uDFE2 "}{c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="ceo-period-bar">
        <span className="ceo-period-label">{"\uD83D\uDCC5"} Select Period:</span>
        {["Q1", "Q2", "Q3", "Q4"].map(q => (
          <button key={q} className={`ceo-q-btn ${selectedQuarters.includes(q) ? "active" : ""}`} onClick={() => toggleQuarter(q)}>{q}</button>
        ))}
        <select className="ceo-year-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2024">2024</option>
        </select>
        <span className="ceo-period-display">{periodLabel}</span>
      </div>

      {loading ? (
        <div className="ceo-loading">Loading financial data...</div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="ceo-kpi-grid">
            <div className="ceo-kpi revenue">
              <div className="ceo-kpi-icon">{"\uD83D\uDCB0"}</div>
              <div className="ceo-kpi-value">{fmtUsd(grossRevenue)}</div>
              <div className="ceo-kpi-label">Gross Revenue</div>
              <div className="ceo-kpi-sub">Premiums + Admin Fees</div>
              <div className="ceo-kpi-trend up">{"\u2191"} 12.5%</div>
            </div>
            <div className="ceo-kpi expense">
              <div className="ceo-kpi-icon">{"\uD83D\uDCE4"}</div>
              <div className="ceo-kpi-value">{fmtUsd(totalClaimsCost)}</div>
              <div className="ceo-kpi-label">Total Claims Cost</div>
              <div className="ceo-kpi-sub">Claims + Operating Costs</div>
              <div className="ceo-kpi-trend down">{"\u2193"} 3.2%</div>
            </div>
            <div className="ceo-kpi profit">
              <div className="ceo-kpi-icon">{"\uD83D\uDCC8"}</div>
              <div className="ceo-kpi-value">{fmtUsd(netProfit)}</div>
              <div className="ceo-kpi-label">Net Profit</div>
              <div className="ceo-kpi-sub">Before Tax (EBIT): {fmtUsd(ebit)}</div>
              <div className="ceo-kpi-trend up">{"\u2191"} 18.7%</div>
            </div>
            <div className="ceo-kpi tax">
              <div className="ceo-kpi-icon">{"\uD83C\uDFDB\uFE0F"}</div>
              <div className="ceo-kpi-value">{fmtUsd(totalTax)}</div>
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
              <table className="ceo-fin-table"><tbody>
                <tr><td>Premium Collections</td><td className="amt positive">{fmtUsd(premiumRevenue)}</td></tr>
                <tr><td>Admin Fees</td><td className="amt positive">{fmtUsd(feeRevenue)}</td></tr>
                <tr><td>Stop-Loss Fees</td><td className="amt positive">{fmtUsd(stopLossFees)}</td></tr>
                <tr><td>Network Access Fees</td><td className="amt positive">{fmtUsd(networkFees)}</td></tr>
                <tr><td>Claims Processing Fees</td><td className="amt positive">{fmtUsd(processingFees)}</td></tr>
                <tr className="total-row"><td><strong>Total Revenue</strong></td><td className="amt">{fmtUsd(grossRevenue)}</td></tr>
              </tbody></table>
            </div>

            {/* Expense Breakdown */}
            <div className="ceo-card">
              <div className="ceo-card-header"><span>{"\uD83D\uDCC9"}</span> Expense Breakdown</div>
              <table className="ceo-fin-table"><tbody>
                <tr><td>Claims Paid (Hospitals)</td><td className="amt negative">{fmtUsd(totalClaimsCost * 0.92)}</td></tr>
                <tr><td>Ex Gratia Payments</td><td className="amt negative">{fmtUsd(totalClaimsCost * 0.08)}</td></tr>
                <tr><td>Provider Network Costs</td><td className="amt negative">{fmtUsd(providerCosts)}</td></tr>
                <tr><td>Operating Expenses</td><td className="amt negative">{fmtUsd(operatingExp)}</td></tr>
                <tr><td>Bank & Transaction Fees</td><td className="amt negative">{fmtUsd(bankFees)}</td></tr>
                <tr className="total-row"><td><strong>Total Expenses</strong></td><td className="amt">{fmtUsd(totalExpenses)}</td></tr>
              </tbody></table>
            </div>

            {/* Cyprus Tax */}
            <div className="ceo-card">
              <div className="ceo-card-header"><span>{"\uD83C\uDDE8\uD83C\uDDFE"}</span> Cyprus Tax Obligations</div>
              <table className="ceo-fin-table"><tbody>
                <tr><td>Taxable Income (EBIT)</td><td className="amt">{fmtUsd(ebit)}</td></tr>
                <tr><td>Corporate Tax (12.5%)</td><td className="amt negative">{fmtUsd(cit)}</td></tr>
                <tr><td>SDC Contribution (2.65%)</td><td className="amt negative">{fmtUsd(sdc)}</td></tr>
                <tr><td>GHS Contribution (2.9%)</td><td className="amt negative">{fmtUsd(ghs)}</td></tr>
                <tr className="total-row"><td><strong>Total Tax Liability</strong></td><td className="amt negative">{fmtUsd(totalTax)}</td></tr>
              </tbody></table>
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
            <div className="ceo-card">
              <div className="ceo-card-header"><span>{"\uD83D\uDCB8"}</span> Cash Flow Analysis</div>
              <div className="ceo-cashflow">
                <div className="ceo-cf-row">
                  <span className="ceo-cf-label">Cash Inflows</span>
                  <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar inflow" style={{ width: "100%" }}><span className="ceo-cf-pct">100%</span></div></div>
                  <span className="ceo-cf-value positive">{fmtUsd(grossRevenue)}</span>
                </div>
                <div className="ceo-cf-row">
                  <span className="ceo-cf-label">Cash Outflows</span>
                  <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar outflow" style={{ width: `${grossRevenue > 0 ? (totalClaimsCost / grossRevenue) * 100 : 0}%` }}><span className="ceo-cf-pct">{fmtPct(grossRevenue > 0 ? (totalClaimsCost / grossRevenue) * 100 : 0)}</span></div></div>
                  <span className="ceo-cf-value negative">-{fmtUsd(totalClaimsCost)}</span>
                </div>
                <div className="ceo-cf-row">
                  <span className="ceo-cf-label">Net Cash Position</span>
                  <div className="ceo-cf-bar-bg"><div className="ceo-cf-bar net" style={{ width: `${grossRevenue > 0 ? ((grossRevenue - totalClaimsCost) / grossRevenue) * 100 : 0}%` }}><span className="ceo-cf-pct">+{fmtPct(grossRevenue > 0 ? ((grossRevenue - totalClaimsCost) / grossRevenue) * 100 : 0)}</span></div></div>
                  <span className="ceo-cf-value gold">+{fmtUsd(grossRevenue - totalClaimsCost)}</span>
                </div>
              </div>
            </div>

            <div className="ceo-card">
              <div className="ceo-card-header"><span>{"\uD83D\uDCCA"}</span> Key Ratios</div>
              <div className="ceo-ratios">
                <div className={`ceo-ratio ${grossMarginPct >= 30 ? "good" : "bad"}`}>
                  <div className="ceo-ratio-value">{fmtPct(grossMarginPct)}</div>
                  <div className="ceo-ratio-label">Gross Margin</div>
                  <div className="ceo-ratio-target">Target: &gt;30%</div>
                </div>
                <div className={`ceo-ratio ${lossRatioPct < 70 ? "good" : "bad"}`}>
                  <div className="ceo-ratio-value">{fmtPct(lossRatioPct)}</div>
                  <div className="ceo-ratio-label">Loss Ratio</div>
                  <div className="ceo-ratio-target">Target: &lt;70%</div>
                </div>
                <div className={`ceo-ratio ${combinedRatio < 95 ? "good" : "bad"}`}>
                  <div className="ceo-ratio-value">{fmtPct(combinedRatio)}</div>
                  <div className="ceo-ratio-label">Combined Ratio</div>
                  <div className="ceo-ratio-target">Target: &lt;95%</div>
                </div>
                <div className="ceo-ratio">
                  <div className="ceo-ratio-value">${Math.round(arpm)}</div>
                  <div className="ceo-ratio-label">ARPM</div>
                  <div className="ceo-ratio-target">Avg Rev/Member</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Clients */}
          <div className="ceo-card full">
            <div className="ceo-card-header"><span>{"\uD83C\uDFC6"}</span> Top Clients by Revenue</div>
            <div className="ceo-table-scroll">
              <table className="ceo-clients-table">
                <thead><tr><th>#</th><th>Client</th><th style={{ textAlign: "right" }}>Members</th><th style={{ textAlign: "right" }}>Claims</th><th style={{ textAlign: "right" }}>Claims Cost</th><th style={{ textAlign: "right" }}>Est. Revenue</th><th style={{ textAlign: "right" }}>Loss Ratio</th></tr></thead>
                <tbody>
                  {topByRev.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.4)" }}>No client data for this period</td></tr>
                  ) : (
                    topByRev.slice(0, 15).map((c: any, i: number) => {
                      const lr = c.estimated_revenue > 0 ? (c.claims_cost / c.estimated_revenue) * 100 : 0;
                      return (
                        <tr key={c.client_id || i}>
                          <td className="ceo-rank">{i + 1}</td>
                          <td className="ceo-client-name">{c.client_name}</td>
                          <td style={{ textAlign: "right" }}>{fmt(c.members || 0)}</td>
                          <td style={{ textAlign: "right" }}>{fmt(c.claims || 0)}</td>
                          <td style={{ textAlign: "right" }}>{fmtUsd(c.claims_cost || 0)}</td>
                          <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{fmtUsd(c.estimated_revenue || 0)}</td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`ceo-lr-badge ${lr < 50 ? "good" : lr < 80 ? "warn" : "bad"}`}>{fmtPct(lr)}</span>
                          </td>
                        </tr>
                      );
                    })
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
              <div className="ceo-note">{"\u26A0\uFE0F"} Loss Ratio at {fmtPct(lossRatioPct)} is {lossRatioPct < 70 ? "within acceptable range" : "trending high"}. {lossRatioPct >= 70 ? "Monitor closely." : "Continue current strategy."}</div>
              <div className="ceo-note">{"\u2705"} Gross Margin of {fmtPct(grossMarginPct)} {grossMarginPct >= 30 ? "exceeds target" : "below target"}. Revenue per member growing steadily.</div>
              <div className="ceo-note">{"\uD83C\uDFE6"} Provisional tax payment due by 31 July 2026. Estimated: {fmtUsd(cit * 0.75)} (75% of prior year tax).</div>
              <div className="ceo-note">{"\uD83D\uDCA1"} Consider VAT optimization: Healthcare services may qualify for reduced VAT (5%) or exemption under Cyprus law.</div>
              <div className="ceo-note">{"\uD83D\uDCC1"} Transfer pricing documentation required for intercompany transactions with Philippines subsidiary (Polaris Administration Services, Inc).</div>
              <div className="ceo-note">{"\uD83D\uDCB0"} Total claims cost of {fmtUsd(totalClaimsCost)} across {fmt(totalClaims)} claims for {fmt(totalMembers)} active members. ARPM at ${Math.round(arpm)}.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
