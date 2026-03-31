"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ClientOption } from "@/components/dashboard/quarter-selector";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════
export interface DashboardStats {
  active_clients: number;
  open_offers: number;
  active_contracts: number;
  total_members: number;
  pending_signatures: number;
}

export interface KPIData {
  total_members: number;
  total_claims: number;
  total_cost_usd: number;
  total_cost_eur: number;
  avg_cost_per_claim: number;
  avg_cost_per_member: number;
  loss_ratio: number;
  utilization_rate: number;
  inpatient_claims: number;
  outpatient_claims: number;
  inpatient_cost: number;
  outpatient_cost: number;
  dental_claims: number;
  dental_cost: number;
  chronic_claims: number;
  chronic_cost: number;
  maternity_claims: number;
  maternity_cost: number;
  accident_claims: number;
  accident_cost: number;
  // Inpatient/Outpatient/ExGratia cases
  inpatient_cases: number;
  outpatient_cases: number;
  ex_gratia_cases: number;
  ex_gratia_cost: number;
  // Principal vs Dependent
  principal_count: number;
  dependent_count: number;
  principal_claims: number;
  dependent_claims: number;
  // Member Movement
  new_enrollments: number;
  cancellations: number;
  net_change: number;
}

export interface QuarterData {
  quarter: string;
  kpis: KPIData;
}

export interface CategoryData {
  category: string;
  claims: number;
  cost: number;
  percentage: number;
}

export interface HospitalData {
  hospital_name: string;
  country: string;
  claims: number;
  total_cost: number;
  avg_cost: number;
}

export interface GeoData {
  country: string;
  claims: number;
  cost: number;
  members: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
function getCurrentQuarter(): string {
  const month = new Date().getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

function getQuarterDateRange(quarter: string, year: number) {
  const ranges: Record<string, { start: string; end: string }> = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  };
  return ranges[quarter] || ranges.Q1;
}

const emptyKPIs: KPIData = {
  total_members: 0,
  total_claims: 0,
  total_cost_usd: 0,
  total_cost_eur: 0,
  avg_cost_per_claim: 0,
  avg_cost_per_member: 0,
  loss_ratio: 0,
  utilization_rate: 0,
  inpatient_claims: 0,
  outpatient_claims: 0,
  inpatient_cost: 0,
  outpatient_cost: 0,
  dental_claims: 0,
  dental_cost: 0,
  chronic_claims: 0,
  chronic_cost: 0,
  maternity_claims: 0,
  maternity_cost: 0,
  accident_claims: 0,
  accident_cost: 0,
  inpatient_cases: 0,
  outpatient_cases: 0,
  ex_gratia_cases: 0,
  ex_gratia_cost: 0,
  principal_count: 0,
  dependent_count: 0,
  principal_claims: 0,
  dependent_claims: 0,
  new_enrollments: 0,
  cancellations: 0,
  net_change: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Get REAL members from Clients list (not FinancialData)
// ═══════════════════════════════════════════════════════════════════════════
function getTotalMembersFromClients(
  clientId: string,
  clients: ClientOption[]
): number | null {
  if (!clients || clients.length === 0) return null;

  if (clientId === "ALL" || clientId === "all") {
    const parents = clients.filter(
      (c) => (c.client_type || "").toLowerCase() === "parent"
    );
    if (parents.length === 0) {
      return clients.reduce((sum, c) => sum + (c.total_members || 0), 0);
    }
    return parents.reduce((sum, c) => sum + (c.total_members || 0), 0);
  }

  if (clientId.startsWith("GROUP:")) {
    const parentId = clientId.replace("GROUP:", "");
    const parent = clients.find((c) => c.client_id === parentId);
    return parent?.total_members || null;
  }

  const client = clients.find((c) => c.client_id === clientId);
  return client?.total_members || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Resolve display name for the client badge
// ═══════════════════════════════════════════════════════════════════════════
function getClientDisplayName(
  clientId: string,
  clients: ClientOption[]
): string {
  if (clientId === "ALL" || clientId === "all") return "All Clients";

  if (clientId.startsWith("GROUP:")) {
    const parentId = clientId.replace("GROUP:", "");
    const parent = clients.find((c) => c.client_id === parentId);
    const name = parent?.client_name || parent?.company_name || "Group";
    return `\u{1F476} ${name} (Group)`;
  }

  const client = clients.find((c) => c.client_id === clientId);
  if (!client) return clientId;

  const name = client.client_name || client.company_name || clientId;
  return name.replace(/^\u{1F476}\s*/u, "").replace(/^\u{1F6E1}\uFE0F\s*/u, "").replace(/^\s*\u2514\u2500\s*/, "");
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════
export function useDashboard() {
  // ── State ────────────────────────────────────────────────────────
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

  // ── Data ─────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpis, setKpis] = useState<KPIData>(emptyKPIs);
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);

  // ── Derived ──────────────────────────────────────────────────────
  const clientDisplayName = useMemo(
    () => getClientDisplayName(selectedClient, clients),
    [selectedClient, clients]
  );

  const realMemberCount = useMemo(
    () => getTotalMembersFromClients(selectedClient, clients),
    [selectedClient, clients]
  );

  // ═══════════════════════════════════════════════════════════════════
  // API Loaders
  // ═══════════════════════════════════════════════════════════════════

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/getClients");
      const data = await res.json();
      const clientList = data.clients || data.data || [];
      setClients(clientList);
      return clientList;
    } catch (err) {
      console.error("Failed to load clients:", err);
      return [];
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/getDashboardKPIs");
      const data = await res.json();
      if (data.summary) {
        setStats({
          active_clients: data.summary.active_clients || 0,
          open_offers: data.summary.open_offers || 0,
          active_contracts: data.summary.active_contracts || 0,
          total_members: data.summary.total_members || 0,
          pending_signatures: data.summary.pending_signatures || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // ── Load KPIs ────────────────────────────────────────────────────
  const loadKPIs = useCallback(async () => {
    try {
      const quarters = [...selectedQuarters].sort();
      const results: QuarterData[] = [];

      const apiClientId = selectedClient === "all" ? "ALL" : selectedClient;

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
          clientId: apiClientId,
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

        // Calculate principal/dependent claims proportionally
        const principalMembers = data.kpis?.principal_members || data.memberTypes?.principal || 0;
        const dependentMembers = data.kpis?.dependent_members || data.memberTypes?.dependent || 0;
        const totalMembersBoth = principalMembers + dependentMembers;
        const principalRatio = totalMembersBoth > 0 ? principalMembers / totalMembersBoth : 0.62;
        const totalClaimsForSplit = data.kpis?.total_claims || 0;

        // Calculate proportional costs by case type
        const inCases = data.kpis?.inpatient_cases || data.claimTypes?.inpatient || 0;
        const outCases = data.kpis?.outpatient_cases || data.claimTypes?.outpatient || 0;
        const exCases = data.kpis?.exgratia_cases || data.claimTypes?.exgratia || 0;
        const totalAllCases = inCases + outCases + exCases;
        const totalCostUsd = data.kpis?.total_cost_usd || 0;

        // If API provides specific costs, use them; otherwise distribute proportionally
        const apiInpatientCost = data.kpis?.inpatient_cost || 0;
        const apiOutpatientCost = data.kpis?.outpatient_cost || 0;
        const apiExgratiaCost = data.kpis?.exgratia_cost || 0;
        const hasSpecificCosts = apiInpatientCost > 0 || apiOutpatientCost > 0;

        const calcInpatientCost = hasSpecificCosts ? apiInpatientCost : (totalAllCases > 0 ? Math.round(totalCostUsd * (inCases / totalAllCases) * 100) / 100 : 0);
        const calcOutpatientCost = hasSpecificCosts ? apiOutpatientCost : (totalAllCases > 0 ? Math.round(totalCostUsd * (outCases / totalAllCases) * 100) / 100 : 0);
        const calcExgratiaCost = hasSpecificCosts ? apiExgratiaCost : (totalAllCases > 0 ? Math.round(totalCostUsd * (exCases / totalAllCases) * 100) / 100 : 0);

        const kpiData: KPIData = {
          total_members: data.kpis?.total_members || 0,
          total_claims: data.kpis?.total_claims || 0,
          total_cost_usd: totalCostUsd,
          total_cost_eur: data.kpis?.total_cost_eur || 0,
          avg_cost_per_claim: data.kpis?.avg_cost_per_claim || data.kpis?.cost_per_member || 0,
          avg_cost_per_member: data.kpis?.avg_cost_per_member || data.kpis?.cost_per_member || 0,
          loss_ratio: data.kpis?.loss_ratio || 0,
          utilization_rate: data.kpis?.utilization_rate || data.kpis?.claims_per_member || 0,
          inpatient_claims: data.kpis?.inpatient_claims || inCases || 0,
          outpatient_claims: data.kpis?.outpatient_claims || outCases || 0,
          inpatient_cost: calcInpatientCost,
          outpatient_cost: calcOutpatientCost,
          dental_claims: data.kpis?.dental_claims || 0,
          dental_cost: data.kpis?.dental_cost || 0,
          chronic_claims: data.kpis?.chronic_claims || 0,
          chronic_cost: data.kpis?.chronic_cost || 0,
          maternity_claims: data.kpis?.maternity_claims || 0,
          maternity_cost: data.kpis?.maternity_cost || 0,
          accident_claims: data.kpis?.accident_claims || 0,
          accident_cost: data.kpis?.accident_cost || 0,
          // ── Inpatient/Outpatient/ExGratia cases ──
          inpatient_cases: inCases,
          outpatient_cases: outCases,
          ex_gratia_cases: exCases,
          ex_gratia_cost: calcExgratiaCost,
          // ── NEW: Principal vs Dependent ──
          principal_count: principalMembers,
          dependent_count: dependentMembers,
          principal_claims: Math.round(totalClaimsForSplit * principalRatio),
          dependent_claims: Math.round(totalClaimsForSplit * (1 - principalRatio)),
          // ── NEW: Member Movement ──
          new_enrollments: data.kpis?.new_enrollments || 0,
          cancellations: data.kpis?.cancellations || 0,
          net_change: data.kpis?.net_change || 0,
        };

        // Override members with REAL count from Clients sheet
        const realMembers = getTotalMembersFromClients(apiClientId, clients);
        if (realMembers !== null && realMembers > 0) {
          kpiData.total_members = realMembers;
          if (kpiData.total_members > 0) {
            kpiData.avg_cost_per_member =
              kpiData.total_cost_usd / kpiData.total_members;
            kpiData.utilization_rate =
              kpiData.total_claims / kpiData.total_members;
          }
        }

        results.push({ quarter: q, kpis: kpiData });
      }

      if (results.length > 0) {
        setKpis(results[results.length - 1].kpis);
      }
      setQuarterData(results);
    } catch (err) {
      console.error("Failed to load KPIs:", err);
      setError("Failed to load KPI data");
    }
  }, [selectedClient, selectedYear, selectedQuarters, cumulativeMode, clients]);

  // ── Load breakdowns ──────────────────────────────────────────────
  const loadBreakdowns = useCallback(async () => {
    const apiClientId =
      selectedClient === "ALL" || selectedClient === "all"
        ? ""
        : selectedClient;

    try {
      const [catRes, hospRes, geoRes] = await Promise.all([
        fetch(
          `/api/proxy/getCategoriesBreakdown${apiClientId ? `?clientId=${apiClientId}` : ""}`
        ).then((r) => r.json()),
        fetch(
          `/api/proxy/getHospitalsData${apiClientId ? `?clientId=${apiClientId}` : ""}`
        ).then((r) => r.json()),
        fetch(
          `/api/proxy/getGeoDistribution${apiClientId ? `?clientId=${apiClientId}` : ""}`
        )
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (hospRes.data) setHospitals(hospRes.data);
      if (geoRes.data) setGeoData(geoRes.data);
    } catch (err) {
      console.error("Failed to load breakdowns:", err);
    }
  }, [selectedClient]);

  // ═══════════════════════════════════════════════════════════════════
  // Master refresh
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // Initial load
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Re-load when filters change
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      Promise.all([loadKPIs(), loadBreakdowns()])
        .catch(() => setError("Failed to refresh data"))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient, selectedYear, selectedQuarters, cumulativeMode]);

  // ═══════════════════════════════════════════════════════════════════
  // Quarter toggle
  // ═══════════════════════════════════════════════════════════════════
  const toggleQuarter = (q: string) => {
    setSelectedQuarters((prev) => {
      if (compareMode) {
        if (prev.includes(q)) {
          return prev.length > 1 ? prev.filter((x) => x !== q) : prev;
        }
        return [...prev, q];
      }
      return [q];
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════════════════
  return {
    loading,
    error,
    clients,
    selectedClient,
    selectedYear,
    selectedQuarters,
    cumulativeMode,
    compareMode,
    clientDisplayName,
    realMemberCount,
    stats,
    kpis,
    quarterData,
    categories,
    hospitals,
    geoData,
    setSelectedClient,
    setSelectedYear,
    toggleQuarter,
    setCumulativeMode,
    setCompareMode,
    refresh,
  };
}
