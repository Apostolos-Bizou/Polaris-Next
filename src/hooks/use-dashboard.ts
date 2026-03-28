"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────
export interface KPIData {
  total_members: number;
  total_claims: number;
  total_cost_usd: number;
  total_fees: number;
  loss_ratio: number;
  avg_claim: number;
  new_enrollments: number;
  cancellations: number;
  inpatient_cases: number;
  outpatient_cases: number;
  ex_gratia_cases: number;
  inpatient_cost: number;
  outpatient_cost: number;
  ex_gratia_cost: number;
  principal_count: number;
  dependent_count: number;
  principal_claims: number;
  dependent_claims: number;
}

export interface ClientOption {
  client_id: string;
  company_name: string;
  parent_client_id?: string;
  has_subsidiaries?: boolean;
}

export interface DashboardStats {
  active_clients: number;
  open_offers: number;
  active_contracts: number;
  total_members: number;
  pending_signatures: number;
}

export interface CategoryData {
  category: string;
  cases: number;
  cost: number;
  percentage: number;
}

export interface HospitalData {
  name: string;
  city: string;
  region: string;
  claims: number;
  cost_usd: number;
  avg_claim: number;
}

export interface QuarterData {
  quarter: string;
  kpis: KPIData;
}

// ─── Quarter helpers ─────────────────────────────────────
function getQuarterDateRange(quarter: string, year: number) {
  const ranges: Record<string, { start: string; end: string }> = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };
  return ranges[quarter] || ranges.Q1;
}

function getCurrentQuarter(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

// ─── Default empty KPIs ─────────────────────────────────
const emptyKPIs: KPIData = {
  total_members: 0,
  total_claims: 0,
  total_cost_usd: 0,
  total_fees: 0,
  loss_ratio: 0,
  avg_claim: 0,
  new_enrollments: 0,
  cancellations: 0,
  inpatient_cases: 0,
  outpatient_cases: 0,
  ex_gratia_cases: 0,
  inpatient_cost: 0,
  outpatient_cost: 0,
  ex_gratia_cost: 0,
  principal_count: 0,
  dependent_count: 0,
  principal_claims: 0,
  dependent_claims: 0,
};

// ─── Main hook ───────────────────────────────────────────
export function useDashboard() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>([
    getCurrentQuarter(),
  ]);
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpis, setKpis] = useState<KPIData>(emptyKPIs);
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);

  // ── Load clients list ──────────────────────────────
  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/getClients");
      const data = await res.json();
      if (data.clients || data.data) {
        setClients(data.clients || data.data || []);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  }, []);

  // ── Load dashboard stats bar ───────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/getDashboardKPIs");
      const data = await res.json();
      if (data.summary) {
        setStats({
        active_clients: 0,
        open_offers: 0,
        active_contracts: 0,
        total_members: data.members || data.data?.total_members || 0,
        pending_signatures: 0,
      });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // ── Load KPIs for selected client/quarter ──────────
  const loadKPIs = useCallback(async () => {
    try {
      const quarters = [...selectedQuarters].sort();
      const results: QuarterData[] = [];

      for (const q of quarters) {
        let startDate: string, endDate: string;

        if (cumulativeMode) {
          const q1Range = getQuarterDateRange("Q1", selectedYear);
          const qRange = getQuarterDateRange(q, selectedYear);
          startDate = q1Range.start;
          endDate = qRange.end;
        } else {
          const qRange = getQuarterDateRange(q, selectedYear);
          startDate = qRange.start;
          endDate = qRange.end;
        }

        const params = new URLSearchParams({
          clientId: selectedClient || "ALL",
          startDate,
          endDate,
          quarter: q,
          year: selectedYear.toString(),
        });

        if (cumulativeMode) params.append("cumulative", "true");

        const res = await fetch(
          `/api/proxy/getClientKPISummary?${params.toString()}`
        );
        const data = await res.json();

        const kpiData: KPIData = {
          total_members: data.kpis?.total_members || 0,
          total_claims: data.kpis?.total_claims || 0,
          total_cost_usd: data.kpis?.total_cost_usd || 0,
          total_fees: data.kpis?.total_fees || 0,
          loss_ratio: data.kpis?.loss_ratio || 0,
          avg_claim: data.kpis?.avg_claim || 0,
          new_enrollments:
            data.kpis?.new_enrollments || data.kpis?.enrollments || 0,
          cancellations: data.kpis?.cancellations || 0,
          inpatient_cases: data.kpis?.inpatient_cases || 0,
          outpatient_cases: data.kpis?.outpatient_cases || 0,
          ex_gratia_cases: data.kpis?.ex_gratia_cases || 0,
          inpatient_cost: data.kpis?.inpatient_cost || 0,
          outpatient_cost: data.kpis?.outpatient_cost || 0,
          ex_gratia_cost: data.kpis?.ex_gratia_cost || 0,
          principal_count: data.kpis?.principal_count || 0,
          dependent_count: data.kpis?.dependent_count || 0,
          principal_claims: data.kpis?.principal_claims || 0,
          dependent_claims: data.kpis?.dependent_claims || 0,
        };

        results.push({ quarter: q, kpis: kpiData });
      }

      setQuarterData(results);

      // Set main KPIs to latest quarter
      if (results.length > 0) {
        setKpis(results[results.length - 1].kpis);
      }
    } catch (err) {
      console.error("Failed to load KPIs:", err);
      setError("Failed to load KPI data");
    }
  }, [selectedClient, selectedYear, selectedQuarters, cumulativeMode]);

  // ── Load categories & hospitals ────────────────────
  const loadBreakdowns = useCallback(async () => {
    const clientId =
      selectedClient === "ALL" ? "" : selectedClient.replace("GROUP:", "");

    try {
      const [catRes, hospRes] = await Promise.all([
        fetch(
          `/api/proxy/getCategoriesBreakdown${clientId ? `?clientId=${clientId}` : ""}`
        ).then((r) => r.json()),
        fetch(
          `/api/proxy/getHospitalsData${clientId ? `?clientId=${clientId}` : ""}`
        ).then((r) => r.json()),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (hospRes.data) setHospitals(hospRes.data);
    } catch (err) {
      console.error("Failed to load breakdowns:", err);
    }
  }, [selectedClient]);

  // ── Master load function ───────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadStats(), loadClients()]);
      await Promise.all([loadKPIs(), loadBreakdowns()]);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadClients, loadKPIs, loadBreakdowns]);

  // ── Initial load ───────────────────────────────────
  useEffect(() => {
    refresh();
  }, []);

  // ── Reload when filters change ─────────────────────
  useEffect(() => {
    if (!loading) {
      loadKPIs();
      loadBreakdowns();
    }
  }, [selectedClient, selectedYear, selectedQuarters, cumulativeMode]);

  // ── Quarter toggle ─────────────────────────────────
  const toggleQuarter = (q: string) => {
    setSelectedQuarters((prev) => {
      if (compareMode) {
        // In compare mode, toggle selection
        if (prev.includes(q)) {
          return prev.length > 1 ? prev.filter((x) => x !== q) : prev;
        }
        return [...prev, q];
      }
      // Single mode: select only this quarter
      return [q];
    });
  };

  return {
    // State
    loading,
    error,
    clients,
    selectedClient,
    selectedYear,
    selectedQuarters,
    cumulativeMode,
    compareMode,

    // Data
    stats,
    kpis,
    quarterData,
    categories,
    hospitals,

    // Actions
    setSelectedClient,
    setSelectedYear,
    toggleQuarter,
    setCumulativeMode,
    setCompareMode,
    refresh,
  };
}

