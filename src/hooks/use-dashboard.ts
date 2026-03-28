"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ClientOption } from "@/components/dashboard/quarter-selector";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════
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
};

// ═══════════════════════════════════════════════════════════════════════
// Helper: Get REAL members from Clients list (not FinancialData)
// Clients sheet has total_members = contractual members (11,483)
// FinancialData only has members with claims data (8,878 for Q4)
// ═══════════════════════════════════════════════════════════════════════
function getTotalMembersFromClients(
  clientId: string,
  clients: ClientOption[]
): number | null {
  if (!clients || clients.length === 0) return null;

  if (clientId === "ALL" || clientId === "all") {
    // Sum all parent members (avoid double counting with subs)
    const parents = clients.filter(
      (c) => (c.client_type || "").toLowerCase() === "parent"
    );
    if (parents.length === 0) {
      // No hierarchy — sum all
      return clients.reduce((sum, c) => sum + (c.total_members || 0), 0);
    }
    return parents.reduce((sum, c) => sum + (c.total_members || 0), 0);
  }

  if (clientId.startsWith("GROUP:")) {
    const parentId = clientId.replace("GROUP:", "");
    const parent = clients.find((c) => c.client_id === parentId);
    // Parent total_members already includes subsidiaries in Polaris data model
    return parent?.total_members || null;
  }

  const client = clients.find((c) => c.client_id === clientId);
  return client?.total_members || null;
}

// ═══════════════════════════════════════════════════════════════════════
// Helper: Resolve display name for the client badge
// ═══════════════════════════════════════════════════════════════════════
function getClientDisplayName(
  clientId: string,
  clients: ClientOption[]
): string {
  if (clientId === "ALL" || clientId === "all") return "All Clients";

  if (clientId.startsWith("GROUP:")) {
    const parentId = clientId.replace("GROUP:", "");
    const parent = clients.find((c) => c.client_id === parentId);
    const name = parent?.client_name || parent?.company_name || "Group";
    return `🏢 ${name} (Group)`;
  }

  const client = clients.find((c) => c.client_id === clientId);
  if (!client) return clientId;

  const name = client.client_name || client.company_name || clientId;
  // Clean up emoji prefixes if any
  return name.replace(/^🏢\s*/, "").replace(/^🏛️\s*/, "").replace(/^\s*└─\s*/, "");
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════
export function useDashboard() {
  // ── State ────────────────────────────────────────────────────────────
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

  // ── Data ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpis, setKpis] = useState<KPIData>(emptyKPIs);
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);

  // ── Derived: Client display name for badge ───────────────────────────
  const clientDisplayName = useMemo(
    () => getClientDisplayName(selectedClient, clients),
    [selectedClient, clients]
  );

  // ── Derived: Real member count from Clients sheet ────────────────────
  const realMemberCount = useMemo(
    () => getTotalMembersFromClients(selectedClient, clients),
    [selectedClient, clients]
  );

  // ═══════════════════════════════════════════════════════════════════
  // API Loaders
  // ═══════════════════════════════════════════════════════════════════

  // ── Load clients list ──────────────────────────────────────────────
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

  // ── Load stats bar (global company stats) ──────────────────────────
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

  // ── Load KPIs for selected client + quarter ────────────────────────
  // Supports: "ALL", "CLI-2026-XXXX", "GROUP:CLI-2026-XXXX"
  // GROUP: sends the prefix to backend for server-side aggregation
  // ════════════════════════════════════════════════════════════════════
  const loadKPIs = useCallback(async () => {
    try {
      const quarters = [...selectedQuarters].sort();
      const results: QuarterData[] = [];

      // v4.0: Send selectedClient as-is (including GROUP: prefix)
      // Backend handles GROUP: aggregation server-side
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

        const kpiData: KPIData = {
          total_members: data.kpis?.total_members || 0,
          total_claims: data.kpis?.total_claims || 0,
          total_cost_usd: data.kpis?.total_cost_usd || 0,
          total_cost_eur: data.kpis?.total_cost_eur || 0,
          avg_cost_per_claim: data.kpis?.avg_cost_per_claim || 0,
          avg_cost_per_member: data.kpis?.avg_cost_per_member || 0,
          loss_ratio: data.kpis?.loss_ratio || 0,
          utilization_rate: data.kpis?.utilization_rate || 0,
          inpatient_claims: data.kpis?.inpatient_claims || 0,
          outpatient_claims: data.kpis?.outpatient_claims || 0,
          inpatient_cost: data.kpis?.inpatient_cost || 0,
          outpatient_cost: data.kpis?.outpatient_cost || 0,
          dental_claims: data.kpis?.dental_claims || 0,
          dental_cost: data.kpis?.dental_cost || 0,
          chronic_claims: data.kpis?.chronic_claims || 0,
          chronic_cost: data.kpis?.chronic_cost || 0,
          maternity_claims: data.kpis?.maternity_claims || 0,
          maternity_cost: data.kpis?.maternity_cost || 0,
          accident_claims: data.kpis?.accident_claims || 0,
          accident_cost: data.kpis?.accident_cost || 0,
        };

        // v3.37: Override members with REAL count from Clients sheet
        const realMembers = getTotalMembersFromClients(apiClientId, clients);
        if (realMembers !== null && realMembers > 0) {
          kpiData.total_members = realMembers;
          // Recalculate per-member metrics
          if (kpiData.total_members > 0) {
            kpiData.avg_cost_per_member =
              kpiData.total_cost_usd / kpiData.total_members;
            kpiData.utilization_rate =
              kpiData.total_claims / kpiData.total_members;
          }
        }

        results.push({ quarter: q, kpis: kpiData });
      }

      // Set KPIs from last selected quarter (or first if single)
      if (results.length > 0) {
        setKpis(results[results.length - 1].kpis);
      }
      setQuarterData(results);
    } catch (err) {
      console.error("Failed to load KPIs:", err);
      setError("Failed to load KPI data");
    }
  }, [selectedClient, selectedYear, selectedQuarters, cumulativeMode, clients]);

  // ── Load breakdowns (categories, hospitals, geo) ───────────────────
  const loadBreakdowns = useCallback(async () => {
    // Determine clientId for API (pass GROUP: as-is for server aggregation)
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
  // Master refresh — loads everything in parallel
  // ═══════════════════════════════════════════════════════════════════
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Step 1: Load clients + stats in parallel
      await Promise.all([loadStats(), loadClients()]);
      // Step 2: Load KPIs + breakdowns in parallel (needs clients first)
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
  // Re-load when filters change (client, year, quarters, cumulative)
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
  // Quarter toggle logic
  // ═══════════════════════════════════════════════════════════════════
  const toggleQuarter = (q: string) => {
    setSelectedQuarters((prev) => {
      if (compareMode) {
        // Compare mode: toggle multi-select
        if (prev.includes(q)) {
          return prev.length > 1 ? prev.filter((x) => x !== q) : prev;
        }
        return [...prev, q];
      }
      // Single mode: select only this quarter
      return [q];
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════════════════
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

    // Derived
    clientDisplayName,
    realMemberCount,

    // Data
    stats,
    kpis,
    quarterData,
    categories,
    hospitals,
    geoData,

    // Actions
    setSelectedClient,
    setSelectedYear,
    toggleQuarter,
    setCumulativeMode,
    setCompareMode,
    refresh,
  };
}
