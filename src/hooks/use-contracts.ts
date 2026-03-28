"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════
export interface ContractRecord {
  contract_id: string;
  client_id: string;
  client_name: string;
  client_type: string;         // "parent" | "subsidiary" | ""
  parent_client_id: string;
  doc_type: string;            // "ASA" | "NDA" | "DPA" | "Service Agreement" | "-"
  status: string;              // "Active" | "Signed" | "Sent" | "Draft" | "Expired" | "No Contract"
  version: string;
  effective_date: string | null;
  expiry_date: string | null;
  signed_date?: string | null;
  created_date?: string | null;
  auto_renewal?: boolean;
  has_contract: boolean;
  sort_priority: number;
  total_members?: number;
  contact_name?: string;
  contact_email?: string;
  gdrive_folder_url?: string;
  current_doc_url?: string;
  offer_id?: string;
  financials?: {
    plan_gold_members?: number;
    plan_platinum_members?: number;
    plan_diamond_members?: number;
    fund_amount?: number;
    running_cost_annual?: number;
    has_dental?: string;
  };
  history?: Array<{
    action: string;
    action_date: string;
    notes: string;
  }>;
}

export interface ContractStats {
  total: number;
  active: number;
  signed: number;
  sent: number;
  draft: number;
  expired: number;
  expiring_soon: number;
  no_contract: number;
}

export interface ContractFilters {
  status: string;
  type: string;
  entity: string;
  client: string;
  dateRange: string;
  search: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════
function getContractPriority(status: string): number {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "running") return 1;
  if (s === "signed" || s === "completed") return 2;
  if (s === "sent" || s === "pending signature") return 3;
  if (s === "draft") return 4;
  if (s === "expired") return 5;
  return 10;
}

function getStatusClass(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "running") return "active";
  if (s === "signed" || s === "completed") return "signed";
  if (s === "sent") return "sent";
  if (s === "draft") return "draft";
  if (s === "expired") return "expired";
  if (s === "no contract") return "no-contract";
  return s;
}

export function formatContractDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function getDaysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return null;
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Dummy Data (matches original 63 clients)
// ═══════════════════════════════════════════════════════════════════════
const DUMMY_CONTRACTS: ContractRecord[] = [
  // ── ELETSON ──
  { contract_id: "CON-2025-0001", client_id: "CLI-2026-0001", client_name: "ELETSON", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2025-12-31", signed_date: "2023-12-15", has_contract: true, sort_priority: 1, total_members: 850, contact_name: "Panagiotis Eletson", contact_email: "pe@eletson.com" },
  { contract_id: "CON-2025-0002", client_id: "CLI-2026-0002", client_name: "ELETSON GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-01-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 320 },
  { contract_id: "CON-2025-0003", client_id: "CLI-2026-0003", client_name: "ELETSON PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-01-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 280 },
  { contract_id: "CON-2025-0004", client_id: "CLI-2026-0004", client_name: "ELETSON SILVER", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-06-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 250 },

  // ── THENAMARIS ──
  { contract_id: "CON-2025-0010", client_id: "CLI-2026-0005", client_name: "THENAMARIS", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "4", effective_date: "2024-01-01", expiry_date: "2026-06-30", signed_date: "2023-11-20", has_contract: true, sort_priority: 1, total_members: 1250, contact_name: "Ioannis Theodorou", contact_email: "it@thenamaris.com" },
  { contract_id: "CON-2025-0011", client_id: "CLI-2026-0006", client_name: "THENAMARIS GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2026-06-30", has_contract: true, sort_priority: 1, total_members: 480 },
  { contract_id: "CON-2025-0012", client_id: "CLI-2026-0007", client_name: "THENAMARIS PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2026-06-30", has_contract: true, sort_priority: 1, total_members: 420 },
  { contract_id: "CON-2025-0013", client_id: "CLI-2026-0008", client_name: "THENAMARIS DIAMOND", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-03-01", expiry_date: "2026-06-30", has_contract: true, sort_priority: 1, total_members: 350 },

  // ── EURONAV ──
  { contract_id: "CON-2025-0020", client_id: "CLI-2026-0009", client_name: "EURONAV", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-04-01", expiry_date: "2026-03-31", has_contract: true, sort_priority: 1, total_members: 780, contact_name: "Hugo De Stoop", contact_email: "hds@euronav.com" },
  { contract_id: "CON-2025-0021", client_id: "CLI-2026-0010", client_name: "EURONAV GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0009", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-04-01", expiry_date: "2026-03-31", has_contract: true, sort_priority: 1, total_members: 380 },
  { contract_id: "CON-2025-0022", client_id: "CLI-2026-0011", client_name: "EURONAV PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0009", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-04-01", expiry_date: "2026-03-31", has_contract: true, sort_priority: 1, total_members: 400 },

  // ── TSAKOS ──
  { contract_id: "CON-2025-0030", client_id: "CLI-2026-0012", client_name: "TSAKOS ENERGY NAVIGATION", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "5", effective_date: "2023-07-01", expiry_date: "2025-06-30", signed_date: "2023-06-20", has_contract: true, sort_priority: 1, total_members: 1100, contact_name: "Nikolas Tsakos", contact_email: "nt@tenn.gr" },
  { contract_id: "CON-2025-0031", client_id: "CLI-2026-0013", client_name: "TSAKOS GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0012", doc_type: "ASA", status: "Active", version: "4", effective_date: "2023-07-01", expiry_date: "2025-06-30", has_contract: true, sort_priority: 1, total_members: 450 },
  { contract_id: "CON-2025-0032", client_id: "CLI-2026-0014", client_name: "TSAKOS PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0012", doc_type: "ASA", status: "Active", version: "4", effective_date: "2023-07-01", expiry_date: "2025-06-30", has_contract: true, sort_priority: 1, total_members: 390 },
  { contract_id: "CON-2025-0033", client_id: "CLI-2026-0015", client_name: "TSAKOS SILVER", client_type: "subsidiary", parent_client_id: "CLI-2026-0012", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2025-06-30", has_contract: true, sort_priority: 1, total_members: 260 },

  // ── DYNACOM ──
  { contract_id: "CON-2025-0040", client_id: "CLI-2026-0016", client_name: "DYNACOM TANKERS", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Signed", version: "1", effective_date: "2025-01-01", expiry_date: "2026-12-31", signed_date: "2024-12-10", has_contract: true, sort_priority: 2, total_members: 620, contact_name: "Georgios Procopiou", contact_email: "gp@dynacom.gr" },
  { contract_id: "CON-2025-0041", client_id: "CLI-2026-0017", client_name: "DYNACOM GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0016", doc_type: "ASA", status: "Signed", version: "1", effective_date: "2025-01-01", expiry_date: "2026-12-31", has_contract: true, sort_priority: 2, total_members: 310 },
  { contract_id: "CON-2025-0042", client_id: "CLI-2026-0018", client_name: "DYNACOM PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0016", doc_type: "ASA", status: "Signed", version: "1", effective_date: "2025-01-01", expiry_date: "2026-12-31", has_contract: true, sort_priority: 2, total_members: 310 },

  // ── DANAOS ──
  { contract_id: "CON-2025-0050", client_id: "CLI-2026-0019", client_name: "DANAOS CORPORATION", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-02-01", expiry_date: "2025-08-31", has_contract: true, sort_priority: 1, total_members: 540, contact_name: "John Coustas", contact_email: "jc@danaos.com" },
  { contract_id: "CON-2025-0051", client_id: "CLI-2026-0020", client_name: "DANAOS GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0019", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-02-01", expiry_date: "2025-08-31", has_contract: true, sort_priority: 1, total_members: 270 },
  { contract_id: "CON-2025-0052", client_id: "CLI-2026-0021", client_name: "DANAOS PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0019", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-02-01", expiry_date: "2025-08-31", has_contract: true, sort_priority: 1, total_members: 270 },

  // ── STAR BULK ──
  { contract_id: "CON-2025-0060", client_id: "CLI-2026-0022", client_name: "STAR BULK CARRIERS", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Sent", version: "1", effective_date: null, expiry_date: null, has_contract: true, sort_priority: 3, total_members: 920, contact_name: "Petros Pappas", contact_email: "pp@starbulk.com" },
  { contract_id: "CON-2025-0061", client_id: "CLI-2026-0023", client_name: "STAR BULK GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0022", doc_type: "ASA", status: "Sent", version: "1", effective_date: null, expiry_date: null, has_contract: true, sort_priority: 3, total_members: 460 },

  // ── NAVIOS ──
  { contract_id: "CON-2025-0070", client_id: "CLI-2026-0024", client_name: "NAVIOS MARITIME", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Draft", version: "1", effective_date: null, expiry_date: null, has_contract: true, sort_priority: 4, total_members: 680, contact_name: "Angeliki Frangou", contact_email: "af@navios.com" },

  // ── COSTAMARE ──
  { contract_id: "CON-2025-0080", client_id: "CLI-2026-0026", client_name: "COSTAMARE INC", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-03-01", expiry_date: "2025-09-30", has_contract: true, sort_priority: 1, total_members: 430, contact_name: "Konstantinos Konstantakopoulos", contact_email: "kk@costamare.com" },
  { contract_id: "CON-2025-0081", client_id: "CLI-2026-0027", client_name: "COSTAMARE GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0026", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-03-01", expiry_date: "2025-09-30", has_contract: true, sort_priority: 1, total_members: 215 },
  { contract_id: "CON-2025-0082", client_id: "CLI-2026-0028", client_name: "COSTAMARE PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0026", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-06-01", expiry_date: "2025-09-30", has_contract: true, sort_priority: 1, total_members: 215 },

  // ── MINERVA MARINE ──
  { contract_id: "CON-2025-0090", client_id: "CLI-2026-0029", client_name: "MINERVA MARINE", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Expired", version: "2", effective_date: "2023-01-01", expiry_date: "2024-12-31", has_contract: true, sort_priority: 5, total_members: 560, contact_name: "Andreas Martinos", contact_email: "am@minervamarine.com" },

  // ── CAPITAL MARITIME ──
  { contract_id: "CON-2025-0100", client_id: "CLI-2026-0031", client_name: "CAPITAL MARITIME", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-15", expiry_date: "2026-01-14", has_contract: true, sort_priority: 1, total_members: 720, contact_name: "Evangelos Marinakis", contact_email: "em@capital-ship.com" },
  { contract_id: "CON-2025-0101", client_id: "CLI-2026-0032", client_name: "CAPITAL MARITIME GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0031", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-15", expiry_date: "2026-01-14", has_contract: true, sort_priority: 1, total_members: 360 },
  { contract_id: "CON-2025-0102", client_id: "CLI-2026-0033", client_name: "CAPITAL MARITIME PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0031", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-04-01", expiry_date: "2026-01-14", has_contract: true, sort_priority: 1, total_members: 360 },

  // ── MARAN ──
  { contract_id: "CON-2025-0110", client_id: "CLI-2026-0034", client_name: "MARAN TANKERS", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "4", effective_date: "2024-01-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 980, contact_name: "John Angelicoussis", contact_email: "ja@maran.com" },
  { contract_id: "CON-2025-0111", client_id: "CLI-2026-0035", client_name: "MARAN GAS", client_type: "subsidiary", parent_client_id: "CLI-2026-0034", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 490 },
  { contract_id: "CON-2025-0112", client_id: "CLI-2026-0036", client_name: "MARAN DRY", client_type: "subsidiary", parent_client_id: "CLI-2026-0034", doc_type: "ASA", status: "Active", version: "3", effective_date: "2024-01-01", expiry_date: "2025-12-31", has_contract: true, sort_priority: 1, total_members: 490 },

  // ── COMPANIES WITHOUT SUBSIDIARIES ──
  { contract_id: "CON-2025-0120", client_id: "CLI-2026-0037", client_name: "ATLANTIC BULK CARRIERS", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-07-01", expiry_date: "2026-06-30", has_contract: true, sort_priority: 1, total_members: 180, contact_name: "Dimitris Melas", contact_email: "dm@atlantic.gr" },
  { contract_id: "CON-2025-0121", client_id: "CLI-2026-0039", client_name: "PHOENIX SHIPPING", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-03-01", expiry_date: "2025-10-31", has_contract: true, sort_priority: 1, total_members: 220, contact_name: "Nikolaos Phoenix", contact_email: "np@phoenix.gr" },
  { contract_id: "CON-2025-0122", client_id: "CLI-2026-0041", client_name: "AEGEAN SHIPPING", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Expired", version: "1", effective_date: "2023-06-01", expiry_date: "2024-05-31", has_contract: true, sort_priority: 5, total_members: 145, contact_name: "Spyros Aegean", contact_email: "sa@aegean.gr" },
  { contract_id: "CON-2025-0123", client_id: "CLI-2026-0043", client_name: "NEPTUNE LINES", client_type: "parent", parent_client_id: "", doc_type: "NDA", status: "Sent", version: "1", effective_date: null, expiry_date: null, has_contract: true, sort_priority: 3, total_members: 310, contact_name: "Christos Neptune", contact_email: "cn@neptune.gr" },
  { contract_id: "-", client_id: "CLI-2026-0045", client_name: "POSEIDON MARITIME", client_type: "parent", parent_client_id: "", doc_type: "-", status: "No Contract", version: "-", effective_date: null, expiry_date: null, has_contract: false, sort_priority: 99, total_members: 260 },
  { contract_id: "-", client_id: "CLI-2026-0047", client_name: "OLYMPIA OCEAN CARRIERS", client_type: "parent", parent_client_id: "", doc_type: "-", status: "No Contract", version: "-", effective_date: null, expiry_date: null, has_contract: false, sort_priority: 99, total_members: 195 },
  { contract_id: "CON-2025-0130", client_id: "CLI-2026-0049", client_name: "KYKLADES MARITIME CORPORATION", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-09-01", expiry_date: "2025-08-31", has_contract: true, sort_priority: 1, total_members: 156, contact_name: "Stavros Nikos", contact_email: "sn@kyklades.gr" },
  { contract_id: "CON-2025-0131", client_id: "CLI-2026-0050", client_name: "KYKLADES PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0049", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-09-01", expiry_date: "2025-08-31", has_contract: true, sort_priority: 1, total_members: 156 },
  { contract_id: "CON-2025-0140", client_id: "CLI-2026-0053", client_name: "LEADER MARINE", client_type: "parent", parent_client_id: "", doc_type: "ASA", status: "Active", version: "2", effective_date: "2024-05-01", expiry_date: "2026-04-30", has_contract: true, sort_priority: 1, total_members: 478, contact_name: "Alexandros Metaxas", contact_email: "am@leader.gr" },
  { contract_id: "CON-2025-0141", client_id: "CLI-2026-0054", client_name: "LEADER MARINE AQUILA BULKERS INC GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0053", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-05-01", expiry_date: "2026-04-30", has_contract: true, sort_priority: 1, total_members: 95 },
  { contract_id: "CON-2025-0142", client_id: "CLI-2026-0055", client_name: "LEADER MARINE FALCON SHIPHOLDING INC GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0053", doc_type: "ASA", status: "Active", version: "1", effective_date: "2024-05-01", expiry_date: "2026-04-30", has_contract: true, sort_priority: 1, total_members: 87 },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════
export function useContracts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allContracts, setAllContracts] = useState<ContractRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "active" | "expiring" | "templates">("list");
  const [filters, setFilters] = useState<ContractFilters>({
    status: "",
    type: "",
    entity: "",
    client: "",
    dateRange: "",
    search: "",
  });

  // ── Load data ────────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // In production: fetch from /api/proxy/getContracts + /api/proxy/getClients
      // For now: use dummy data
      // const [contractsRes, clientsRes] = await Promise.all([
      //   fetch("/api/proxy/getContracts").then(r => r.json()),
      //   fetch("/api/proxy/getClients").then(r => r.json()),
      // ]);
      // ... combine logic from original HTML ...

      // Sort alphabetically
      const sorted = [...DUMMY_CONTRACTS].sort((a, b) =>
        (a.client_name || "").localeCompare(b.client_name || "")
      );
      setAllContracts(sorted);
    } catch (err) {
      console.error("Failed to load contracts:", err);
      setError("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // ── Stats ────────────────────────────────────────────────────────────
  const stats: ContractStats = useMemo(() => {
    const active = allContracts.filter(c =>
      ["active", "running"].includes((c.status || "").toLowerCase()) && c.has_contract
    ).length;
    const signed = allContracts.filter(c =>
      ["signed", "completed"].includes((c.status || "").toLowerCase())
    ).length;
    const sent = allContracts.filter(c =>
      (c.status || "").toLowerCase() === "sent"
    ).length;
    const draft = allContracts.filter(c =>
      (c.status || "").toLowerCase() === "draft"
    ).length;
    const expired = allContracts.filter(c =>
      (c.status || "").toLowerCase() === "expired"
    ).length;
    const noContract = allContracts.filter(c => !c.has_contract).length;

    // Expiring within 90 days
    const expiring = allContracts.filter(c => {
      const days = getDaysUntilExpiry(c.expiry_date);
      return days !== null && days > 0 && days <= 90;
    }).length;

    return {
      total: allContracts.filter(c => c.has_contract).length,
      active,
      signed,
      sent,
      draft,
      expired,
      expiring_soon: expiring,
      no_contract: noContract,
    };
  }, [allContracts]);

  // ── Filtered contracts ───────────────────────────────────────────────
  const filteredContracts = useMemo(() => {
    let list = [...allContracts];

    // Tab-based pre-filter
    if (activeTab === "active") {
      list = list.filter(c => {
        const s = (c.status || "").toLowerCase();
        return c.has_contract && (s === "active" || s === "signed");
      });
    } else if (activeTab === "expiring") {
      list = list.filter(c => {
        const days = getDaysUntilExpiry(c.expiry_date);
        return days !== null && days > 0 && days <= 90;
      });
    }

    // Status filter
    if (filters.status) {
      if (filters.status === "No Contract") {
        list = list.filter(c => !c.has_contract);
      } else if (filters.status === "active") {
        list = list.filter(c => {
          const s = (c.status || "").toLowerCase();
          return c.has_contract && (s === "active" || s === "signed");
        });
      } else {
        list = list.filter(c =>
          (c.status || "").toLowerCase() === filters.status.toLowerCase()
        );
      }
    }

    // Type filter
    if (filters.type) {
      list = list.filter(c => c.doc_type === filters.type);
    }

    // Entity filter
    if (filters.entity) {
      list = list.filter(c =>
        (c.client_type || "").toLowerCase() === filters.entity
      );
    }

    // Client/Group filter
    if (filters.client) {
      if (filters.client.startsWith("GROUP:")) {
        const parentId = filters.client.replace("GROUP:", "");
        list = list.filter(c =>
          c.client_id === parentId || c.parent_client_id === parentId
        );
      } else {
        list = list.filter(c => c.client_id === filters.client);
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const days = parseInt(filters.dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(c => {
        if (!c.effective_date) return false;
        return new Date(c.effective_date) >= cutoff;
      });
    }

    // Search
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      list = list.filter(c =>
        (c.client_name || "").toLowerCase().includes(term) ||
        (c.contract_id || "").toLowerCase().includes(term) ||
        (c.contact_name || "").toLowerCase().includes(term) ||
        (c.doc_type || "").toLowerCase().includes(term)
      );
    }

    return list;
  }, [allContracts, filters, activeTab]);

  // ── Unique clients for filter dropdown ───────────────────────────────
  const clientOptions = useMemo(() => {
    const parents = allContracts
      .filter(c => c.client_type === "parent")
      .map(c => ({ id: c.client_id, name: c.client_name }));

    // Deduplicate
    const seen = new Set<string>();
    return parents.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allContracts]);

  // ── Filter update helpers ────────────────────────────────────────────
  const updateFilter = (key: keyof ContractFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", type: "", entity: "", client: "", dateRange: "", search: "" });
    setActiveTab("list");
  };

  // ── Result summary ──────────────────────────────────────────────────
  const resultSummary = useMemo(() => {
    const parents = filteredContracts.filter(c => c.client_type === "parent").length;
    const subs = filteredContracts.filter(c => c.client_type === "subsidiary").length;
    const withContracts = filteredContracts.filter(c => c.has_contract).length;
    const withoutContracts = filteredContracts.filter(c => !c.has_contract).length;
    return `${filteredContracts.length} clients (${parents} parents, ${subs} subsidiaries) — ${withContracts} with contracts, ${withoutContracts} need contracts`;
  }, [filteredContracts]);

  return {
    loading,
    error,
    stats,
    allContracts,
    filteredContracts,
    activeTab,
    filters,
    clientOptions,
    resultSummary,
    setActiveTab,
    updateFilter,
    clearFilters,
    refresh: loadContracts,
    getStatusClass,
    formatContractDate,
    getDaysUntilExpiry,
  };
}
