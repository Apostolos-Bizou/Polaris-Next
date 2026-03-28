import type { DashboardKPIs } from "@/types";

// ─── Dummy KPI data for development ──────────────────────
// This lets us build the UI without a live Cosmos DB connection.
// Replace with real queries once the DB is seeded.

export function getDummyKPIs(): DashboardKPIs {
  return {
    totalClients: 47,
    activeClients: 42,
    totalMembers: 12_847,
    activeMembers: 11_932,
    totalClaims: 34_219,
    pendingClaims: 1_843,
    totalPremiums: 8_450_000,
    totalClaimsPaid: 5_932_400,
    lossRatio: 0.702,
    averageClaimAmount: 173.4,

    claimsByStatus: {
      submitted: 1_843,
      under_review: 967,
      approved: 4_215,
      rejected: 2_108,
      paid: 25_086,
    },

    claimsByMonth: [
      { month: "Σεπ 2025", submitted: 2_810, paid: 2_540, amount: 442_300 },
      { month: "Οκτ 2025", submitted: 3_120, paid: 2_890, amount: 498_700 },
      { month: "Νοε 2025", submitted: 2_950, paid: 2_710, amount: 467_200 },
      { month: "Δεκ 2025", submitted: 3_340, paid: 3_010, amount: 521_800 },
      { month: "Ιαν 2026", submitted: 3_560, paid: 3_180, amount: 553_100 },
      { month: "Φεβ 2026", submitted: 3_210, paid: 2_940, amount: 509_400 },
      { month: "Μαρ 2026", submitted: 2_890, paid: 2_210, amount: 389_900 },
    ],

    topClients: [
      {
        id: "c-001",
        name: "Aegean Airlines",
        members: 2_340,
        claims: 6_120,
        lossRatio: 0.68,
      },
      {
        id: "c-002",
        name: "Eurobank",
        members: 1_890,
        claims: 4_980,
        lossRatio: 0.72,
      },
      {
        id: "c-003",
        name: "OTE Group",
        members: 1_560,
        claims: 4_210,
        lossRatio: 0.65,
      },
      {
        id: "c-004",
        name: "Mytilineos",
        members: 1_120,
        claims: 3_450,
        lossRatio: 0.78,
      },
      {
        id: "c-005",
        name: "Motor Oil",
        members: 980,
        claims: 2_890,
        lossRatio: 0.71,
      },
    ],
  };
}
