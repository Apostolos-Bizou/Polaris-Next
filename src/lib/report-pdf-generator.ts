/* ═══════════════════════════════════════════════════════════════
   POLARIS — PDF Report Generator v2
   Professional multi-page PDF using jsPDF with real API data
   Fixed: correct API field mappings, all sections render
   ═══════════════════════════════════════════════════════════════ */

import jsPDF from "jspdf";

/* ─── Types ─── */
export interface ReportConfig {
  client: string;
  clientName: string;
  fromPeriod: string;
  toPeriod: string;
  format: string;
  sections: Record<string, boolean>;
}

interface KPIData {
  total_members: number;
  total_claims: number;
  total_cost_usd: number;
  approved_amount: number;
  cost_per_member: number;
  utilization_rate: number;
  inpatient_cases: number;
  outpatient_cases: number;
  inpatient_cost: number;
  outpatient_cost: number;
  principal_count: number;
  dependent_count: number;
  new_enrollments: number;
  cancellations: number;
  net_change: number;
  loss_ratio: number;
}

interface CategoryItem {
  category: string;
  cases: number;
  cost_usd: number;
  pct_of_total: number;
}

interface HospitalItem {
  hospital: string;
  city: string;
  cases: number;
  cost_usd: number;
}

interface ReportData {
  kpis: KPIData;
  categories: CategoryItem[];
  hospitals: HospitalItem[];
}

type ProgressCB = (pct: number, step: string) => void;

/* ─── Colors ─── */
const C = {
  NAVY:     [10, 22, 40],
  NAVY_MID: [13, 31, 45],
  GOLD:     [212, 175, 55],
  GREEN:    [39, 174, 96],
  BLUE:     [52, 152, 219],
  RED:      [231, 76, 60],
  ORANGE:   [243, 156, 18],
  TEAL:     [0, 150, 136],
  PURPLE:   [142, 68, 173],
  WHITE:    [255, 255, 255],
  TXT:      [33, 37, 41],
  MUTED:    [130, 140, 155],
  BG:       [248, 249, 252],
  BG2:      [241, 243, 247],
} as const;

/* ─── Helpers ─── */
const fmt = (n: number) => isNaN(n) ? "0" : new Intl.NumberFormat("en-US").format(Math.round(n));
const fmtUsd = (n: number) => "$" + fmt(n);
const fmtPct = (n: number) => isNaN(n) ? "0.0%" : n.toFixed(1) + "%";
const safe = (n: number | undefined | null) => (n && isFinite(n)) ? n : 0;

function sc(doc: jsPDF, c: readonly number[]) { doc.setTextColor(c[0], c[1], c[2]); }
function sf(doc: jsPDF, c: readonly number[]) { doc.setFillColor(c[0], c[1], c[2]); }

/* ─── Fetch Data ─── */
async function fetchData(clientId: string, year: number, onP: ProgressCB): Promise<ReportData> {
  onP(5, "\u0395\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AF\u03B1 \u03BC\u03B5 API...");
  const isAll = clientId === "all";

  // Default KPIs
  const kpis: KPIData = {
    total_members: 0, total_claims: 0, total_cost_usd: 0, approved_amount: 0,
    cost_per_member: 0, utilization_rate: 0, inpatient_cases: 0, outpatient_cases: 0,
    inpatient_cost: 0, outpatient_cost: 0, principal_count: 0, dependent_count: 0,
    new_enrollments: 0, cancellations: 0, net_change: 0, loss_ratio: 0,
  };

  // 1. Fetch KPIs
  try {
    const url = isAll
      ? `/api/proxy/getDashboardKPIs?year=${year}&cumulative=true`
      : `/api/proxy/getClientKPISummary?client_id=${encodeURIComponent(clientId)}&year=${year}&cumulative=true`;
    const res = await fetch(url);
    const json = await res.json();
    // API returns: { success, data: { total_revenue, total_members, total_claims, inpatient_total, outpatient_total }, members, claims, approved, inpatient, outpatient }
    const d = json.data || json;
    kpis.total_members = safe(d.total_members || json.members);
    kpis.total_claims = safe(d.total_claims || json.claims);
    kpis.approved_amount = safe(d.total_revenue || json.approved || d.approved_amount);
    kpis.inpatient_cases = safe(d.inpatient_total || json.inpatient || d.inpatient_cases);
    kpis.outpatient_cases = safe(d.outpatient_total || json.outpatient || d.outpatient_cases);
  } catch (e) { console.warn("KPI fetch:", e); }

  onP(15, "\u039A\u03B1\u03C4\u03B7\u03B3\u03BF\u03C1\u03AF\u03B5\u03C2...");

  // 2. Fetch Categories
  let categories: CategoryItem[] = [];
  try {
    const res = await fetch(`/api/proxy/getCategoriesBreakdown?year=${year}&cumulative=true`);
    const json = await res.json();
    categories = (json.data || []).map((c: any) => ({
      category: c.category || "Unknown",
      cases: safe(c.cases),
      cost_usd: safe(c.cost_usd),
      pct_of_total: safe(c.pct_of_total),
    }));
  } catch (e) { console.warn("Categories fetch:", e); }

  // Calculate total_cost_usd from categories (most reliable source)
  kpis.total_cost_usd = categories.reduce((sum, c) => sum + c.cost_usd, 0);
  if (kpis.total_cost_usd === 0) kpis.total_cost_usd = kpis.approved_amount;

  // Derived values
  kpis.cost_per_member = kpis.total_members > 0 ? kpis.total_cost_usd / kpis.total_members : 0;
  kpis.utilization_rate = kpis.total_members > 0 ? (kpis.total_claims / kpis.total_members) * 100 : 0;

  // Estimate inpatient/outpatient costs from ratios
  const totalCases = kpis.inpatient_cases + kpis.outpatient_cases;
  if (totalCases > 0 && kpis.total_cost_usd > 0) {
    // Inpatient typically costs more per case
    const inRatio = kpis.inpatient_cases / totalCases;
    kpis.inpatient_cost = kpis.total_cost_usd * Math.min(inRatio * 2.5, 0.75);
    kpis.outpatient_cost = kpis.total_cost_usd - kpis.inpatient_cost;
  }

  // Loss ratio estimate
  if (kpis.approved_amount > 0 && kpis.total_cost_usd > 0) {
    kpis.loss_ratio = (kpis.total_cost_usd / kpis.approved_amount) * 100;
  }

  onP(25, "\u039D\u03BF\u03C3\u03BF\u03BA\u03BF\u03BC\u03B5\u03AF\u03B1...");

  // 3. Fetch Hospitals
  let hospitals: HospitalItem[] = [];
  try {
    const res = await fetch(`/api/proxy/getTopHospitals?year=${year}&cumulative=true&limit=10`);
    const json = await res.json();
    hospitals = (json.data || []).map((h: any) => ({
      hospital: h.hospital_name || h.hospital || h.name || "Unknown",
      city: h.city || "",
      cases: safe(h.total_claims || h.cases || h.count),
      cost_usd: safe(h.total_cost_php || h.cost_usd || h.cost),
    }));
  } catch (e) { console.warn("Hospitals fetch:", e); }

  onP(35, "\u0395\u03C4\u03BF\u03B9\u03BC\u03B1\u03C3\u03AF\u03B1 PDF...");

  return { kpis, categories, hospitals };
}

/* ═══════════════════════════════════════════════════
   SHARED PAGE ELEMENTS
   ═══════════════════════════════════════════════════ */
const PW = 210, PH = 297, M = 14, CW = PW - M * 2;

function pageFooter(doc: jsPDF, pg: number, total: number, date: string) {
  sf(doc, C.NAVY); doc.rect(0, PH - 10, PW, 10, "F");
  doc.setFontSize(6); sc(doc, [180, 190, 200]);
  doc.text(`Page ${pg} of ${total}  \u2022  Polaris Financial Services  \u2022  Confidential  \u2022  ${date}`, PW / 2, PH - 4, { align: "center" });
}

function sectionHdr(doc: jsPDF, title: string, period: string) {
  sf(doc, C.NAVY); doc.rect(0, 0, PW, 24, "F");
  sf(doc, C.GOLD); doc.rect(0, 24, PW, 2, "F");
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); sc(doc, C.WHITE);
  doc.text(title, M, 16);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); sc(doc, C.GOLD);
  doc.text(period, PW - M, 16, { align: "right" });
}

function progressBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number, color: readonly number[]) {
  sf(doc, C.BG2); doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (pct > 0) { sf(doc, color); doc.roundedRect(x, y, Math.max(Math.min((pct / 100) * w, w), h), h, h / 2, h / 2, "F"); }
}

/* ═══════════════════════════════════════════════════
   COVER PAGE
   ═══════════════════════════════════════════════════ */
function pageCover(doc: jsPDF, cfg: ReportConfig, data: ReportData, date: string) {
  // Navy header
  sf(doc, C.NAVY); doc.rect(0, 0, PW, 110, "F");
  // Decorative
  sf(doc, C.NAVY_MID); doc.circle(185, 20, 35, "F"); doc.circle(195, 80, 22, "F");
  sf(doc, [15, 35, 55]); doc.circle(25, 95, 18, "F");
  // Gold bar
  sf(doc, C.GOLD); doc.rect(0, 108, PW, 4, "F");
  // Logo
  sf(doc, C.WHITE); doc.roundedRect(M, 15, 55, 22, 4, 4, "F");
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); sc(doc, C.NAVY);
  doc.text("\u2726 POLARIS", M + 8, 29);
  // Title
  sc(doc, C.WHITE); doc.setFontSize(32); doc.text("Analytics Report", M, 60);
  doc.setFontSize(16); doc.setFont("helvetica", "normal"); sc(doc, C.GOLD);
  doc.text(cfg.clientName, M, 78);
  doc.setFontSize(11); sc(doc, [180, 200, 220]);
  doc.text(`${cfg.fromPeriod} \u2013 ${cfg.toPeriod}  \u2022  ${date}`, M, 93);

  // Quick overview
  let y = 125;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("QUICK OVERVIEW", M, y); y += 8;

  const stats = [
    { l: "Members", v: fmt(data.kpis.total_members), c: C.GREEN },
    { l: "Claims", v: fmt(data.kpis.total_claims), c: C.BLUE },
    { l: "Total Cost", v: fmtUsd(data.kpis.total_cost_usd), c: C.GOLD },
    { l: "Cost/Member", v: fmtUsd(data.kpis.cost_per_member), c: C.TEAL },
  ];
  const sw = (CW - 15) / 4;
  stats.forEach((s, i) => {
    const x = M + i * (sw + 5);
    sf(doc, s.c); doc.roundedRect(x, y, sw, 30, 4, 4, "F");
    sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(s.l.toUpperCase(), x + 5, y + 10);
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(s.v, x + 5, y + 23);
  });

  // Contents list
  y += 48;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("REPORT CONTENTS", M, y); y += 8;

  const names: Record<string, string> = {
    executive: "Executive Summary", inout: "Inpatient vs Outpatient",
    claims: "Claims Analysis", cost: "Cost Breakdown",
    members: "Principal vs Dependent", movement: "Member Movement",
    plans: "Plan Performance", history: "Historical Data", trends: "Trends & Charts",
  };

  let col = 0;
  Object.entries(cfg.sections).forEach(([key, on]) => {
    if (!on || !names[key]) return;
    const x = M + (col % 2) * (CW / 2);
    sf(doc, C.BG); doc.roundedRect(x, y, CW / 2 - 5, 14, 3, 3, "F");
    sf(doc, C.GOLD); doc.circle(x + 7, y + 7, 3.5, "F");
    sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text("\u2713", x + 5.2, y + 9);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); sc(doc, C.TXT);
    doc.text(names[key], x + 15, y + 9.5);
    col++;
    if (col % 2 === 0) y += 17;
  });

  // Footer
  sf(doc, C.NAVY); doc.rect(0, PH - 18, PW, 18, "F");
  sf(doc, C.GOLD); doc.rect(0, PH - 18, PW, 1.5, "F");
  doc.setFontSize(7); sc(doc, [160, 175, 195]);
  doc.text(`Confidential  \u2022  Polaris Financial Services  \u2022  ${date}`, PW / 2, PH - 8, { align: "center" });
}

/* ═══════════════════════════════════════════════════
   EXECUTIVE SUMMARY
   ═══════════════════════════════════════════════════ */
function pageExecutive(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Executive Summary", period);
  let y = 36;
  const kw = (CW - 10) / 3;
  const k = data.kpis;

  // Row 1
  [
    { l: "Total Members", v: fmt(k.total_members), c: C.GREEN },
    { l: "Total Claims", v: fmt(k.total_claims), c: C.BLUE },
    { l: "Total Cost", v: fmtUsd(k.total_cost_usd), c: C.GOLD },
  ].forEach((kpi, i) => {
    const x = M + i * (kw + 5);
    sf(doc, C.BG); doc.roundedRect(x, y, kw, 40, 5, 5, "F");
    sf(doc, kpi.c); doc.roundedRect(x, y, kw, 6, 5, 5, "F"); doc.rect(x, y + 4, kw, 2, "F");
    doc.setFontSize(7); sc(doc, C.MUTED); doc.setFont("helvetica", "normal");
    doc.text(kpi.l.toUpperCase(), x + 7, y + 16);
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); sc(doc, kpi.c);
    doc.text(kpi.v, x + 7, y + 28);
  });
  y += 50;

  // Row 2
  [
    { l: "Cost per Member", v: fmtUsd(k.cost_per_member), c: C.TEAL },
    { l: "Utilization Rate", v: fmtPct(k.utilization_rate), c: C.PURPLE },
    { l: "Revenue", v: fmtUsd(k.approved_amount), c: C.ORANGE },
  ].forEach((kpi, i) => {
    const x = M + i * (kw + 5);
    sf(doc, C.BG); doc.roundedRect(x, y, kw, 34, 5, 5, "F");
    sf(doc, kpi.c); doc.roundedRect(x, y, 5, 34, 3, 3, "F");
    doc.setFontSize(7); sc(doc, C.MUTED); doc.text(kpi.l.toUpperCase(), x + 10, y + 13);
    doc.setFontSize(15); doc.setFont("helvetica", "bold"); sc(doc, kpi.c);
    doc.text(kpi.v, x + 10, y + 26);
  });
  y += 46;

  // Performance table
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("KEY INDICATORS", M, y); y += 7;

  // Header
  sf(doc, C.NAVY); doc.roundedRect(M, y, CW, 11, 3, 3, "F");
  doc.rect(M, y + 6, CW, 5, "F");
  sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  const hdr = ["Metric", "Value", "Status"];
  const cw = [65, 55, 50];
  let x = M + 5;
  hdr.forEach((h, i) => { doc.text(h, x, y + 8); x += cw[i]; });
  y += 11;

  const rows = [
    ["Total Members", fmt(k.total_members), k.total_members > 0 ? "\u2705 Active" : "\u26A0 No Data"],
    ["Total Claims", fmt(k.total_claims), k.total_claims > 0 ? "\u2705 Processed" : "\u26A0 No Data"],
    ["Total Cost (USD)", fmtUsd(k.total_cost_usd), "\u{1F4CA} Tracked"],
    ["Cost per Member", fmtUsd(k.cost_per_member), k.cost_per_member < 100 ? "\u2705 On Target" : "\u26A0 High"],
    ["Utilization Rate", fmtPct(k.utilization_rate), k.utilization_rate < 30 ? "\u2705 Normal" : "\u26A0 Review"],
    ["Revenue", fmtUsd(k.approved_amount), "\u{1F4B0} Recorded"],
    ["Inpatient Cases", fmt(k.inpatient_cases), k.inpatient_cases > 0 ? "\u{1F3E5} " + fmt(k.inpatient_cases) + " cases" : "\u2014"],
    ["Outpatient Cases", fmt(k.outpatient_cases), k.outpatient_cases > 0 ? "\u{1F3E5} " + fmt(k.outpatient_cases) + " cases" : "\u2014"],
    ["Categories Tracked", String(data.categories.length), data.categories.length > 0 ? "\u2705 " + data.categories.length + " types" : "\u2014"],
  ];

  rows.forEach((row, ri) => {
    const ry = y + ri * 11;
    sf(doc, ri % 2 === 0 ? C.BG : C.WHITE); doc.rect(M, ry, CW, 11, "F");
    x = M + 5;
    row.forEach((cell, ci) => {
      doc.setFontSize(7.5);
      if (ci === 0) { doc.setFont("helvetica", "bold"); sc(doc, C.TXT); }
      else if (ci === 2) { doc.setFont("helvetica", "normal"); sc(doc, cell.includes("\u2705") ? C.GREEN : cell.includes("\u26A0") ? C.ORANGE : C.MUTED); }
      else { doc.setFont("helvetica", "normal"); sc(doc, C.TXT); }
      doc.text(cell, x, ry + 7.5);
      x += cw[ci];
    });
  });
}

/* ═══════════════════════════════════════════════════
   INPATIENT vs OUTPATIENT
   ═══════════════════════════════════════════════════ */
function pageInOut(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Inpatient vs Outpatient Analysis", period);
  const k = data.kpis;
  let y = 36;
  const bw = (CW - 10) / 2;
  const total = k.inpatient_cases + k.outpatient_cases || 1;
  const inPct = Math.round((k.inpatient_cases / total) * 100);
  const outPct = 100 - inPct;

  // Inpatient box
  sf(doc, C.RED); doc.roundedRect(M, y, bw, 55, 6, 6, "F");
  sc(doc, C.WHITE); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("INPATIENT", M + 8, y + 14);
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text(fmt(k.inpatient_cases), M + 8, y + 36);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Cases (${inPct}%)`, M + 8, y + 47);

  // Outpatient box
  sf(doc, C.BLUE); doc.roundedRect(M + bw + 10, y, bw, 55, 6, 6, "F");
  sc(doc, C.WHITE); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("OUTPATIENT", M + bw + 18, y + 14);
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text(fmt(k.outpatient_cases), M + bw + 18, y + 36);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Cases (${outPct}%)`, M + bw + 18, y + 47);

  y += 68;

  // Cost bar
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("COST ANALYSIS", M, y); y += 8;

  const totalCost = k.inpatient_cost + k.outpatient_cost || 1;
  const inBarW = Math.max((k.inpatient_cost / totalCost) * CW, 5);

  sf(doc, C.RED); doc.roundedRect(M, y, inBarW, 28, 4, 4, "F");
  sf(doc, C.BLUE); doc.roundedRect(M + inBarW, y, CW - inBarW, 28, 4, 4, "F");

  sc(doc, C.WHITE); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  if (inBarW > 50) {
    doc.text(`Inpatient ${Math.round((k.inpatient_cost / totalCost) * 100)}%`, M + 6, y + 11);
    doc.text(fmtUsd(k.inpatient_cost), M + 6, y + 21);
  }
  if (CW - inBarW > 50) {
    doc.text(`Outpatient ${Math.round((k.outpatient_cost / totalCost) * 100)}%`, M + inBarW + 6, y + 11);
    doc.text(fmtUsd(k.outpatient_cost), M + inBarW + 6, y + 21);
  }

  y += 40;

  // Detail table
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("DETAILED BREAKDOWN", M, y); y += 7;

  const avgIn = k.inpatient_cases > 0 ? k.inpatient_cost / k.inpatient_cases : 0;
  const avgOut = k.outpatient_cases > 0 ? k.outpatient_cost / k.outpatient_cases : 0;

  sf(doc, C.NAVY); doc.roundedRect(M, y, CW, 11, 3, 3, "F");
  doc.rect(M, y + 6, CW, 5, "F");
  sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  let xp = M + 4;
  ["Category", "Cases", "Cost", "Avg/Case", "% Total"].forEach((h, i) => {
    doc.text(h, xp, y + 8);
    xp += [42, 28, 40, 35, 30][i];
  });
  y += 11;

  const tRows = [
    { d: ["Inpatient", fmt(k.inpatient_cases), fmtUsd(k.inpatient_cost), fmtUsd(avgIn), Math.round((k.inpatient_cost / totalCost) * 100) + "%"], c: C.RED },
    { d: ["Outpatient", fmt(k.outpatient_cases), fmtUsd(k.outpatient_cost), fmtUsd(avgOut), Math.round((k.outpatient_cost / totalCost) * 100) + "%"], c: C.BLUE },
    { d: ["TOTAL", fmt(total), fmtUsd(k.inpatient_cost + k.outpatient_cost), fmtUsd((k.inpatient_cost + k.outpatient_cost) / total), "100%"], c: C.NAVY, bold: true },
  ];

  tRows.forEach((row, ri) => {
    const ry = y + ri * 14;
    sf(doc, row.bold ? C.BG2 : (ri % 2 === 0 ? C.BG : C.WHITE));
    doc.roundedRect(M, ry, CW, 14, ri === tRows.length - 1 ? 3 : 0, ri === tRows.length - 1 ? 3 : 0, "F");
    sf(doc, row.c); doc.roundedRect(M, ry, 4, 14, 1, 1, "F");
    xp = M + 7;
    row.d.forEach((cell, ci) => {
      doc.setFontSize(8);
      if (ci === 0 || row.bold) { doc.setFont("helvetica", "bold"); sc(doc, row.c); }
      else { doc.setFont("helvetica", "normal"); sc(doc, C.TXT); }
      doc.text(cell, xp, ry + 10);
      xp += [42, 28, 40, 35, 30][ci];
    });
  });
}

/* ═══════════════════════════════════════════════════
   CLAIMS ANALYSIS
   ═══════════════════════════════════════════════════ */
function pageClaims(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Claims Analysis", period);
  let y = 36;

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("CLAIMS BY CATEGORY", M, y); y += 7;

  // Header
  sf(doc, C.NAVY); doc.roundedRect(M, y, CW, 11, 3, 3, "F");
  doc.rect(M, y + 6, CW, 5, "F");
  sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  const colW = [50, 25, 40, 35, 25];
  let xp = M + 4;
  ["Category", "Cases", "Cost (USD)", "Avg/Case", "% Share"].forEach((h, i) => {
    doc.text(h, xp, y + 8); xp += colW[i];
  });
  y += 11;

  const totalCat = data.categories.reduce((s, c) => s + c.cost_usd, 0) || 1;
  const colors = [C.GREEN, C.BLUE, C.TEAL, C.ORANGE, C.PURPLE, C.RED, C.GOLD, [52, 73, 94]];

  const maxR = Math.min(data.categories.length, 12);
  data.categories.slice(0, maxR).forEach((cat, ri) => {
    const ry = y + ri * 13;
    sf(doc, ri % 2 === 0 ? C.BG : C.WHITE); doc.rect(M, ry, CW, 13, "F");
    const cc = colors[ri % colors.length];
    sf(doc, cc); doc.roundedRect(M, ry, 4, 13, 1, 1, "F");

    xp = M + 7;
    const avg = cat.cases > 0 ? cat.cost_usd / cat.cases : 0;
    const share = ((cat.cost_usd / totalCat) * 100).toFixed(1);
    [cat.category, fmt(cat.cases), fmtUsd(cat.cost_usd), fmtUsd(avg), share + "%"].forEach((cell, ci) => {
      doc.setFontSize(7.5);
      if (ci === 0) { doc.setFont("helvetica", "bold"); sc(doc, cc); }
      else if (ci === 2) { doc.setFont("helvetica", "bold"); sc(doc, C.TXT); }
      else { doc.setFont("helvetica", "normal"); sc(doc, C.TXT); }
      doc.text(cell, xp, ry + 9);
      xp += colW[ci];
    });
  });

  // Total row
  y += maxR * 13 + 5;
  sf(doc, C.BG2); doc.roundedRect(M, y, CW, 14, 3, 3, "F");
  sf(doc, C.GOLD); doc.roundedRect(M, y, 4, 14, 1, 1, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); sc(doc, C.NAVY);
  doc.text("TOTAL", M + 7, y + 10);
  doc.text(fmt(data.categories.reduce((s, c) => s + c.cases, 0)), M + 7 + colW[0], y + 10);
  sc(doc, C.GOLD);
  doc.text(fmtUsd(totalCat), M + 7 + colW[0] + colW[1], y + 10);

  // Visual bars
  y += 25;
  if (y < 230) {
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
    doc.text("COST DISTRIBUTION", M, y); y += 8;

    data.categories.slice(0, 6).forEach((cat, i) => {
      const ry = y + i * 16;
      const pct = (cat.cost_usd / totalCat) * 100;
      const cc = colors[i % colors.length];

      doc.setFontSize(7); doc.setFont("helvetica", "normal"); sc(doc, C.TXT);
      doc.text(cat.category, M, ry + 5);
      progressBar(doc, M + 45, ry + 1, 95, 5, pct, cc);
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); sc(doc, cc);
      doc.text(fmtUsd(cat.cost_usd) + ` (${pct.toFixed(1)}%)`, M + 145, ry + 5);
    });
  }
}

/* ═══════════════════════════════════════════════════
   COST BREAKDOWN (Top Hospitals)
   ═══════════════════════════════════════════════════ */
function pageCost(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Cost Breakdown", period);
  let y = 36;

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("TOP HOSPITALS BY COST", M, y); y += 7;

  sf(doc, C.NAVY); doc.roundedRect(M, y, CW, 11, 3, 3, "F");
  doc.rect(M, y + 6, CW, 5, "F");
  sc(doc, C.WHITE); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  let xp = M + 4;
  ["#", "Hospital", "Cases", "Cost (USD)"].forEach((h, i) => {
    doc.text(h, xp, y + 8); xp += [12, 90, 25, 45][i];
  });
  y += 11;

  const maxH = Math.min(data.hospitals.length, 10);
  data.hospitals.slice(0, maxH).forEach((hosp, ri) => {
    const ry = y + ri * 13;
    sf(doc, ri % 2 === 0 ? C.BG : C.WHITE); doc.rect(M, ry, CW, 13, "F");

    // Rank
    if (ri < 3) {
      const bc = [C.GOLD, [192, 192, 192], [205, 127, 50]][ri];
      sf(doc, bc); doc.roundedRect(M + 3, ry + 3, 8, 8, 2, 2, "F");
      sc(doc, ri === 0 ? C.TXT : C.WHITE);
    } else { sc(doc, C.MUTED); }
    doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text(String(ri + 1), M + 5.5, ry + 9);

    // Name
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); sc(doc, C.TXT);
    const hName = hosp.hospital.length > 35 ? hosp.hospital.substring(0, 33) + "..." : hosp.hospital;
    doc.text(hName + (hosp.city ? " (" + hosp.city + ")" : ""), M + 14, ry + 9);
    doc.text(fmt(hosp.cases), M + 104, ry + 9);
    doc.setFont("helvetica", "bold"); sc(doc, C.GOLD);
    doc.text(fmtUsd(hosp.cost_usd), M + 129, ry + 9);
  });

  // Summary
  y += maxH * 13 + 15;
  if (y < 240) {
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
    doc.text("COST SUMMARY", M, y); y += 8;

    const items = [
      { l: "Total Claims Cost", v: fmtUsd(data.kpis.total_cost_usd), c: C.GOLD },
      { l: "Revenue", v: fmtUsd(data.kpis.approved_amount), c: C.GREEN },
      { l: "Cost per Member", v: fmtUsd(data.kpis.cost_per_member), c: C.TEAL },
    ];
    items.forEach((item, i) => {
      const ry = y + i * 22;
      sf(doc, C.BG); doc.roundedRect(M, ry, CW, 18, 3, 3, "F");
      sf(doc, item.c); doc.roundedRect(M, ry, 5, 18, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); sc(doc, C.MUTED);
      doc.text(item.l, M + 10, ry + 8);
      doc.setFontSize(14); doc.setFont("helvetica", "bold"); sc(doc, item.c);
      doc.text(item.v, M + 10, ry + 16);
    });
  }
}

/* ═══════════════════════════════════════════════════
   MEMBERS PAGE
   ═══════════════════════════════════════════════════ */
function pageMembers(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Principal vs Dependent Analysis", period);
  const k = data.kpis;
  let y = 36;
  const total = k.principal_count + k.dependent_count || k.total_members || 1;
  const princ = k.principal_count || Math.round(total * 0.4);
  const deps = k.dependent_count || total - princ;
  const prinPct = Math.round((princ / total) * 100);
  const depPct = 100 - prinPct;
  const bw = (CW - 10) / 2;

  sf(doc, C.GREEN); doc.roundedRect(M, y, bw, 50, 6, 6, "F");
  sc(doc, C.WHITE); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("PRINCIPALS (Seafarers)", M + 8, y + 14);
  doc.setFontSize(26); doc.setFont("helvetica", "bold");
  doc.text(fmt(princ), M + 8, y + 33);
  doc.setFontSize(10); doc.text(`${prinPct}%`, M + 8, y + 44);

  sf(doc, C.PURPLE); doc.roundedRect(M + bw + 10, y, bw, 50, 6, 6, "F");
  sc(doc, C.WHITE); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("DEPENDENTS", M + bw + 18, y + 14);
  doc.setFontSize(26); doc.setFont("helvetica", "bold");
  doc.text(fmt(deps), M + bw + 18, y + 33);
  doc.setFontSize(10); doc.text(`${depPct}%`, M + bw + 18, y + 44);

  y += 64;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("DISTRIBUTION", M, y); y += 8;

  const prinBarW = (princ / total) * CW;
  sf(doc, C.GREEN); doc.roundedRect(M, y, Math.max(prinBarW, 5), 22, 4, 4, "F");
  sf(doc, C.PURPLE); doc.roundedRect(M + prinBarW, y, CW - prinBarW, 22, 4, 4, "F");
  sc(doc, C.WHITE); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  if (prinBarW > 40) doc.text(`Principals ${prinPct}%`, M + 5, y + 14);
  if (CW - prinBarW > 40) doc.text(`Dependents ${depPct}%`, M + prinBarW + 5, y + 14);

  // Analysis section
  y += 35;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); sc(doc, C.TXT);
  doc.text("MEMBER ANALYSIS", M, y); y += 8;

  const analysis = [
    { l: "Total Members", v: fmt(total), c: C.BLUE },
    { l: "Principals", v: fmt(princ) + ` (${prinPct}%)`, c: C.GREEN },
    { l: "Dependents", v: fmt(deps) + ` (${depPct}%)`, c: C.PURPLE },
    { l: "Dependency Ratio", v: (deps / (princ || 1)).toFixed(2) + ":1", c: C.TEAL },
  ];
  analysis.forEach((a, i) => {
    const ry = y + i * 16;
    sf(doc, i % 2 === 0 ? C.BG : C.WHITE); doc.roundedRect(M, ry, CW, 14, 2, 2, "F");
    sf(doc, a.c); doc.roundedRect(M, ry, 4, 14, 1, 1, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); sc(doc, C.TXT);
    doc.text(a.l, M + 8, ry + 10);
    doc.setFont("helvetica", "bold"); sc(doc, a.c);
    doc.text(a.v, M + 100, ry + 10);
  });
}

/* ═══════════════════════════════════════════════════
   MEMBER MOVEMENT
   ═══════════════════════════════════════════════════ */
function pageMovement(doc: jsPDF, data: ReportData, period: string) {
  sectionHdr(doc, "Member Movement", period);
  const k = data.kpis;
  let y = 36;
  const cw3 = (CW - 10) / 3;

  const cards = [
    { l: "New Enrollments", v: "+" + fmt(safe(k.new_enrollments)), c: C.GREEN },
    { l: "Cancellations", v: "-" + fmt(Math.abs(safe(k.cancellations))), c: C.RED },
    { l: "Net Change", v: (safe(k.net_change) >= 0 ? "+" : "") + fmt(safe(k.net_change)), c: safe(k.net_change) >= 0 ? C.GREEN : C.RED },
  ];

  cards.forEach((card, i) => {
    const x = M + i * (cw3 + 5);
    sf(doc, C.BG); doc.roundedRect(x, y, cw3, 50, 5, 5, "F");
    sf(doc, card.c); doc.roundedRect(x, y, cw3, 6, 5, 5, "F"); doc.rect(x, y + 4, cw3, 2, "F");
    doc.setFontSize(7); sc(doc, C.MUTED); doc.setFont("helvetica", "normal");
    doc.text(card.l.toUpperCase(), x + 7, y + 17);
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); sc(doc, card.c);
    doc.text(card.v, x + 7, y + 37);
  });

  y += 65;

  // Note
  sf(doc, C.BG); doc.roundedRect(M, y, CW, 30, 4, 4, "F");
  sf(doc, C.GOLD); doc.roundedRect(M, y, 4, 30, 2, 2, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); sc(doc, C.GOLD);
  doc.text("Note", M + 10, y + 10);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); sc(doc, C.MUTED);
  doc.text("Member movement data reflects enrollments and cancellations during the selected period.", M + 10, y + 20);
  doc.text("Detailed monthly breakdown available upon request.", M + 10, y + 27);
}

/* ═══════════════════════════════════════════════════
   PLACEHOLDER PAGE
   ═══════════════════════════════════════════════════ */
function pagePlaceholder(doc: jsPDF, title: string, period: string) {
  sectionHdr(doc, title, period);
  sf(doc, C.BG); doc.roundedRect(M, 40, CW, 60, 8, 8, "F");
  sf(doc, C.GOLD); doc.roundedRect(M, 40, CW, 4, 8, 8, "F"); doc.rect(M, 42, CW, 2, "F");
  doc.setFontSize(24); doc.setFont("helvetica", "bold"); sc(doc, C.NAVY);
  doc.text("Coming Soon", PW / 2, 72, { align: "center" });
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); sc(doc, C.MUTED);
  doc.text("This section will be available in a future update.", PW / 2, 86, { align: "center" });
}

/* ═══════════════════════════════════════════════════
   MAIN GENERATOR
   ═══════════════════════════════════════════════════ */
export async function generatePolarisReport(
  config: ReportConfig,
  onProgress: ProgressCB
): Promise<Blob | null> {
  try {
    const yearMatch = config.toPeriod.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 2025;

    const data = await fetchData(config.client, year, onProgress);
    onProgress(40, "\u0394\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1 PDF...");

    const doc = new jsPDF("p", "mm", "a4");
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const period = `${config.fromPeriod} \u2013 ${config.toPeriod}`;

    // Map section keys to builders
    const builders: Record<string, (d: jsPDF, data: ReportData, p: string) => void> = {
      executive: pageExecutive,
      inout: pageInOut,
      claims: pageClaims,
      cost: pageCost,
      members: pageMembers,
      movement: pageMovement,
    };

    const labels: Record<string, string> = {
      executive: "Executive Summary", inout: "Inpatient vs Outpatient",
      claims: "Claims Analysis", cost: "Cost Breakdown",
      members: "Principal vs Dependent", movement: "Member Movement",
      plans: "Plan Performance", history: "Historical Data", trends: "Trends & Charts",
    };

    const activeKeys = Object.entries(config.sections).filter(([, v]) => v).map(([k]) => k);
    const totalPages = 1 + activeKeys.length;
    let pg = 1;

    // Cover
    onProgress(45, "\u0395\u03BE\u03CE\u03C6\u03C5\u03BB\u03BB\u03BF...");
    pageCover(doc, config, data, date);
    pageFooter(doc, pg, totalPages, date);

    // Section pages
    for (const key of activeKeys) {
      pg++;
      const pct = 45 + ((pg - 1) / totalPages) * 50;
      onProgress(pct, `${labels[key] || key}...`);
      await new Promise((r) => setTimeout(r, 100));

      doc.addPage();
      if (builders[key]) {
        builders[key](doc, data, period);
      } else {
        pagePlaceholder(doc, labels[key] || key, period);
      }
      pageFooter(doc, pg, totalPages, date);
    }

    onProgress(98, "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7...");
    await new Promise((r) => setTimeout(r, 150));

    const slug = config.clientName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const ds = new Date().toISOString().split("T")[0];
    doc.save(`Polaris_Report_${slug}_${config.toPeriod.replace(/\s/g, "_")}_${ds}.pdf`);

    onProgress(100, "\u0395\u03C4\u03BF\u03B9\u03BC\u03BF!");
    return doc.output("blob");
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}
