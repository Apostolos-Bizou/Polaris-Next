"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════
export interface ClientInfo {
  client_id: string;
  client_name: string;
  client_type: string;
  parent_client_id: string;
  total_members: number;
  status: string;
  country: string;
  contact_name: string;
  contact_email: string;
  contract_start: string;
  contract_end: string;
  plan_type: string;
}

export interface ClientKPIs {
  total_members: number;
  total_claims: number;
  approved_amount: number;
  utilization: number;
  cost_per_member: number;
  loss_ratio: number;
  inpatient_claims: number;
  outpatient_claims: number;
  inpatient_cost: number;
  outpatient_cost: number;
  principal_members: number;
  dependent_members: number;
}

export interface ClientContract {
  contract_id: string;
  doc_type: string;
  status: string;
  version: string;
  effective_date: string | null;
  expiry_date: string | null;
  signed_date?: string | null;
}

export interface ClientFinancials {
  revenue: number;
  claims_paid: number;
  net_profit: number;
  tax_contribution: number;
  gross_margin: number;
  arpm: number;
  cpm: number;
  revenue_share: number;
}

export interface CategoryBreakdown {
  category: string;
  claims: number;
  cost: number;
}

export interface ProviderData {
  name: string;
  country: string;
  claims: number;
  cost: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Dummy data generator based on client
// ═══════════════════════════════════════════════════════════════════════
const CLIENTS_DB: Record<string, ClientInfo> = {
  "CLI-2026-0001": { client_id: "CLI-2026-0001", client_name: "ELETSON", client_type: "parent", parent_client_id: "", total_members: 850, status: "active", country: "Greece", contact_name: "Panagiotis Eletson", contact_email: "pe@eletson.com", contract_start: "2024-01-01", contract_end: "2025-12-31", plan_type: "Gold, Platinum, Silver" },
  "CLI-2026-0002": { client_id: "CLI-2026-0002", client_name: "ELETSON GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", total_members: 320, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-01-01", contract_end: "2025-12-31", plan_type: "Gold" },
  "CLI-2026-0003": { client_id: "CLI-2026-0003", client_name: "ELETSON PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", total_members: 280, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-01-01", contract_end: "2025-12-31", plan_type: "Platinum" },
  "CLI-2026-0004": { client_id: "CLI-2026-0004", client_name: "ELETSON SILVER", client_type: "subsidiary", parent_client_id: "CLI-2026-0001", total_members: 250, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-06-01", contract_end: "2025-12-31", plan_type: "Silver" },
  "CLI-2026-0005": { client_id: "CLI-2026-0005", client_name: "THENAMARIS", client_type: "parent", parent_client_id: "", total_members: 1250, status: "active", country: "Greece", contact_name: "Ioannis Theodorou", contact_email: "it@thenamaris.com", contract_start: "2024-01-01", contract_end: "2026-06-30", plan_type: "Gold, Platinum, Diamond" },
  "CLI-2026-0006": { client_id: "CLI-2026-0006", client_name: "THENAMARIS GOLD", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", total_members: 480, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-01-01", contract_end: "2026-06-30", plan_type: "Gold" },
  "CLI-2026-0007": { client_id: "CLI-2026-0007", client_name: "THENAMARIS PLATINUM", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", total_members: 420, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-01-01", contract_end: "2026-06-30", plan_type: "Platinum" },
  "CLI-2026-0008": { client_id: "CLI-2026-0008", client_name: "THENAMARIS DIAMOND", client_type: "subsidiary", parent_client_id: "CLI-2026-0005", total_members: 350, status: "active", country: "Greece", contact_name: "", contact_email: "", contract_start: "2024-03-01", contract_end: "2026-06-30", plan_type: "Diamond" },
  "CLI-2026-0009": { client_id: "CLI-2026-0009", client_name: "EURONAV", client_type: "parent", parent_client_id: "", total_members: 780, status: "active", country: "Greece", contact_name: "Hugo De Stoop", contact_email: "hds@euronav.com", contract_start: "2024-04-01", contract_end: "2026-03-31", plan_type: "Gold, Platinum" },
  "CLI-2026-0012": { client_id: "CLI-2026-0012", client_name: "TSAKOS ENERGY NAVIGATION", client_type: "parent", parent_client_id: "", total_members: 1100, status: "active", country: "Greece", contact_name: "Nikolas Tsakos", contact_email: "nt@tenn.gr", contract_start: "2023-07-01", contract_end: "2025-06-30", plan_type: "Gold, Platinum, Silver" },
  "CLI-2026-0016": { client_id: "CLI-2026-0016", client_name: "DYNACOM TANKERS", client_type: "parent", parent_client_id: "", total_members: 620, status: "active", country: "Greece", contact_name: "Georgios Procopiou", contact_email: "gp@dynacom.gr", contract_start: "2025-01-01", contract_end: "2026-12-31", plan_type: "Gold, Platinum" },
  "CLI-2026-0019": { client_id: "CLI-2026-0019", client_name: "DANAOS CORPORATION", client_type: "parent", parent_client_id: "", total_members: 540, status: "active", country: "Greece", contact_name: "John Coustas", contact_email: "jc@danaos.com", contract_start: "2024-02-01", contract_end: "2025-08-31", plan_type: "Gold, Platinum" },
  "CLI-2026-0022": { client_id: "CLI-2026-0022", client_name: "STAR BULK CARRIERS", client_type: "parent", parent_client_id: "", total_members: 920, status: "active", country: "Greece", contact_name: "Petros Pappas", contact_email: "pp@starbulk.com", contract_start: "", contract_end: "", plan_type: "Gold" },
  "CLI-2026-0026": { client_id: "CLI-2026-0026", client_name: "COSTAMARE INC", client_type: "parent", parent_client_id: "", total_members: 430, status: "active", country: "Greece", contact_name: "Konstantinos Konstantakopoulos", contact_email: "kk@costamare.com", contract_start: "2024-03-01", contract_end: "2025-09-30", plan_type: "Gold, Platinum" },
  "CLI-2026-0031": { client_id: "CLI-2026-0031", client_name: "CAPITAL MARITIME", client_type: "parent", parent_client_id: "", total_members: 720, status: "active", country: "Greece", contact_name: "Evangelos Marinakis", contact_email: "em@capital-ship.com", contract_start: "2024-01-15", contract_end: "2026-01-14", plan_type: "Gold, Platinum" },
  "CLI-2026-0034": { client_id: "CLI-2026-0034", client_name: "MARAN TANKERS", client_type: "parent", parent_client_id: "", total_members: 980, status: "active", country: "Greece", contact_name: "John Angelicoussis", contact_email: "ja@maran.com", contract_start: "2024-01-01", contract_end: "2025-12-31", plan_type: "Gold" },
  "CLI-2026-0049": { client_id: "CLI-2026-0049", client_name: "KYKLADES MARITIME CORPORATION", client_type: "parent", parent_client_id: "", total_members: 156, status: "active", country: "Greece", contact_name: "Stavros Nikos", contact_email: "sn@kyklades.gr", contract_start: "2024-09-01", contract_end: "2025-08-31", plan_type: "Platinum" },
  "CLI-2026-0053": { client_id: "CLI-2026-0053", client_name: "LEADER MARINE", client_type: "parent", parent_client_id: "", total_members: 478, status: "active", country: "Greece", contact_name: "Alexandros Metaxas", contact_email: "am@leader.gr", contract_start: "2024-05-01", contract_end: "2026-04-30", plan_type: "Gold" },
};

function generateKPIs(client: ClientInfo): ClientKPIs {
  const m = client.total_members;
  const claims = Math.round(m * 0.32);
  const cost = Math.round(claims * 72);
  const inp = Math.round(claims * 0.35);
  const outp = claims - inp;
  return {
    total_members: m,
    total_claims: claims,
    approved_amount: cost,
    utilization: Math.round((claims / m) * 100 * 10) / 10,
    cost_per_member: Math.round(cost / m),
    loss_ratio: Math.round(Math.random() * 20 + 55),
    inpatient_claims: inp,
    outpatient_claims: outp,
    inpatient_cost: Math.round(inp * 95),
    outpatient_cost: Math.round(outp * 48),
    principal_members: Math.round(m * 0.6),
    dependent_members: Math.round(m * 0.4),
  };
}

function generateFinancials(client: ClientInfo, kpis: ClientKPIs): ClientFinancials {
  const revenue = Math.round(kpis.total_members * 120);
  const claims_paid = kpis.approved_amount;
  const net_profit = revenue - claims_paid;
  return {
    revenue,
    claims_paid,
    net_profit,
    tax_contribution: Math.round(net_profit * 0.125),
    gross_margin: Math.round((net_profit / revenue) * 100),
    arpm: Math.round(revenue / kpis.total_members),
    cpm: kpis.cost_per_member,
    revenue_share: Math.round(Math.random() * 8 + 2),
  };
}

function generateCategories(kpis: ClientKPIs): CategoryBreakdown[] {
  const total = kpis.total_claims;
  return [
    { category: "Consultation", claims: Math.round(total * 0.30), cost: Math.round(total * 0.30 * 45) },
    { category: "Laboratory", claims: Math.round(total * 0.22), cost: Math.round(total * 0.22 * 38) },
    { category: "Hospitalization", claims: Math.round(total * 0.15), cost: Math.round(total * 0.15 * 180) },
    { category: "Dental", claims: Math.round(total * 0.12), cost: Math.round(total * 0.12 * 55) },
    { category: "Pharmacy", claims: Math.round(total * 0.11), cost: Math.round(total * 0.11 * 32) },
    { category: "Surgery", claims: Math.round(total * 0.10), cost: Math.round(total * 0.10 * 250) },
  ];
}

function generateProviders(): ProviderData[] {
  return [
    { name: "American Medical Center", country: "Cyprus", claims: 85, cost: 12400 },
    { name: "Apollonion Hospital", country: "Cyprus", claims: 72, cost: 9800 },
    { name: "Iasis Hospital", country: "Cyprus", claims: 54, cost: 7200 },
    { name: "Mediterranean Hospital", country: "Greece", claims: 41, cost: 5600 },
    { name: "Hygeia Hospital", country: "Greece", claims: 38, cost: 4900 },
  ];
}

// ── Client cache (shared across hook instances) ─────────────────────
let _clientsCache: any[] | null = null;
let _clientsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedClients(): Promise<any[]> {
  if (_clientsCache && Date.now() - _clientsCacheTime < CACHE_TTL) {
    return _clientsCache;
  }
  const res = await fetch("/api/proxy/getClients");
  const data = await res.json();
  _clientsCache = data.data || data.clients || [];
  _clientsCacheTime = Date.now();
  return _clientsCache;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════
export function useClientFolder(clientId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [kpis, setKpis] = useState<ClientKPIs | null>(null);
  const [financials, setFinancials] = useState<ClientFinancials | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<ClientInfo[]>([]);

  const loadData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError("");

    try {
      // Use cached clients (5 min TTL)
      const allClients = await getCachedClients();

      // Find this client
      const found = allClients.find(
        (c: any) => c.client_id === clientId || c.id === clientId
      );

      if (!found) {
        setError("Client not found");
        setLoading(false);
        return;
      }

      // Map API data to ClientInfo
      const clientData: ClientInfo = {
        client_id: found.client_id || found.id || clientId,
        client_name: found.client_name || found.name || "Unknown",
        client_type: (found.client_type || "").toLowerCase(),
        parent_client_id: found.parent_client_id || "",
        total_members: found.total_members || found.member_count || 0,
        status: found.status || "active",
        country: found.country || "Greece",
        contact_name: found.contact_name || "",
        contact_email: found.contact_email || "",
        contract_start: found.contract_start || "",
        contract_end: found.contract_end || "",
        plan_type: found.plan_type || "",
      };

      setClient(clientData);

      // Generate KPIs
      const clientKpis = generateKPIs(clientData);
      setKpis(clientKpis);

      // Generate financials
      setFinancials(generateFinancials(clientData, clientKpis));

      // Categories
      setCategories(generateCategories(clientKpis));

      // Providers
      setProviders(generateProviders());

      // Find subsidiaries if parent
      if (clientData.client_type === "parent") {
        const subs = allClients
          .filter((c: any) => c.parent_client_id === clientId)
          .map((c: any) => ({
            client_id: c.client_id || c.id || "",
            client_name: c.client_name || c.name || "",
            client_type: (c.client_type || "").toLowerCase(),
            parent_client_id: c.parent_client_id || "",
            total_members: c.total_members || c.member_count || 0,
            status: c.status || "active",
            country: c.country || "Greece",
            contact_name: c.contact_name || "",
            contact_email: c.contact_email || "",
            contract_start: c.contract_start || "",
            contract_end: c.contract_end || "",
            plan_type: c.plan_type || "",
          }));
        setSubsidiaries(subs);
      } else {
        setSubsidiaries([]);
      }

      // Dummy contracts
      setContracts([
        {
          contract_id: `CON-${clientId.replace("CLI-", "")}`,
          doc_type: "ASA",
          status: clientData.status === "active" ? "Active" : "Draft",
          version: "2",
          effective_date: clientData.contract_start || null,
          expiry_date: clientData.contract_end || null,
          signed_date: clientData.contract_start || null,
        },
      ]);
    } catch (err) {
      console.error("Failed to load client:", err);
      setError("Failed to load client data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived: initials ──────────────────────────────────────────────
  const initials = useMemo(() => {
    if (!client) return "??";
    return client.client_name
      .split(" ")
      .map(w => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [client]);

  // ── Derived: days until expiry ─────────────────────────────────────
  const daysUntilExpiry = useMemo(() => {
    if (!client?.contract_end) return null;
    const exp = new Date(client.contract_end);
    if (isNaN(exp.getTime())) return null;
    return Math.floor((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [client]);

  return {
    loading,
    error,
    client,
    kpis,
    financials,
    categories,
    providers,
    contracts,
    subsidiaries,
    initials,
    daysUntilExpiry,
    refresh: loadData,
  };
}
