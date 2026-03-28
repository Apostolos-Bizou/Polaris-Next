import type { DashboardKPIs } from "@/types";
import { getDummyKPIs } from "./dummy-data";

// ─── Feature flag: switch to real data when Cosmos is ready ──
const USE_LIVE_DATA = process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY;

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  if (!USE_LIVE_DATA) {
    // Development mode: return dummy data
    return getDummyKPIs();
  }

  // Production mode: query Cosmos DB
  // TODO: Implement real queries when DB is seeded
  // const { queryItems } = await import("./cosmos");
  // const clients = await queryItems("clients", "SELECT VALUE COUNT(1) FROM c");
  // ...

  return getDummyKPIs(); // Fallback for now
}

// ─── Utility: format currency ────────────────────────────
export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Utility: format percentage ──────────────────────────
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ─── Utility: format number ─────────────────────────────
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("el-GR").format(value);
}
