'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types (keep same interface so page.tsx doesn't need changes) ────
export interface ClientInfo {
  client_id: string;
  client_name: string;
  client_type: string;
  parent_client_id: string;
  status: string;
  contract_start: string | null;
  contract_end: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  mobile: string;
  registered_address: string;
  operating_address: string;
  tin_number: string;
  vat_number: string;
  contact_capacity: string;
  authorized_signatory_name: string;
  authorized_signatory_title: string;
}

export interface ClientKPIs {
  total_members: number;
  total_claims: number;
  total_cost_usd: number;
  total_fees: number;
  inpatient_cases: number;
  outpatient_cases: number;
  exgratia_cases: number;
  principal_members: number;
  dependent_members: number;
  new_enrollments: number;
  cancellations: number;
  cost_per_member: number;
  utilization: number;
  avg_claim_cost: number;
}

export interface ClientFinancials {
  total_revenue: number;
  total_claims_cost: number;
  gross_profit: number;
  profit_margin: number;
  loss_ratio: number;
  admin_fees: number;
  net_profit: number;
  tax_amount: number;  // Cyprus 12.5% CIT
  after_tax_profit: number;
  revenue_per_member: number;
  claims_per_member_cost: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  cost: number;
}

export interface ProviderData {
  name: string;
  hospital?: string;
  claims: number;
  cost: number;
  country?: string;
}

export interface ClientContract {
  contract_id: string;
  doc_type: string;
  status: string;
  version: string;
  effective_date: string | null;
  expiry_date: string | null;
  signed_date: string | null;
}

// ─── Client list cache (shared across instances) ─────────────────────
let allClientsCache: ClientInfo[] | null = null;
let allClientsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAllClients(): Promise<ClientInfo[]> {
  if (allClientsCache && Date.now() - allClientsCacheTime < CACHE_TTL) {
    return allClientsCache;
  }
  try {
    const res = await fetch('/api/proxy/getClients');
    const data = await res.json();
    if (data.success && data.data) {
      allClientsCache = data.data.map((c: any) => ({
        client_id: c.client_id || '',
        client_name: c.client_name || '',
        client_type: c.client_type || '',
        parent_client_id: c.parent_client_id || '',
        status: c.status || 'active',
        contract_start: c.contract_start || null,
        contract_end: c.contract_end || null,
        contact_name: c.contact_name || '',
        contact_email: c.contact_email || '',
        contact_phone: c.contact_phone || '',
        mobile: c.mobile || '',
        registered_address: c.registered_address || '',
        operating_address: c.operating_address || '',
        tin_number: c.tin_number || '',
        vat_number: c.vat_number ? String(c.vat_number) : '',
        contact_capacity: c.contact_capacity || '',
        authorized_signatory_name: c.authorized_signatory_name || '',
        authorized_signatory_title: c.authorized_signatory_title || '',
      }));
      allClientsCacheTime = Date.now();
      return allClientsCache!;
    }
  } catch (err) {
    console.error('Failed to fetch clients:', err);
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HOOK — NOW WITH REAL API DATA
// ═══════════════════════════════════════════════════════════════════════
export function useClientFolder(clientId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    setError('');

    try {
      // ═══ Step 1: Get client info from clients list ═══
      const allClients = await fetchAllClients();
      const clientData = allClients.find(c => c.client_id === clientId);

      if (!clientData) {
        setError('Client not found');
        setLoading(false);
        return;
      }

      setClient(clientData);

      // Find subsidiaries if parent
      if (clientData.client_type === 'parent') {
        const subs = allClients.filter(c => c.parent_client_id === clientId);
        setSubsidiaries(subs);
      } else {
        setSubsidiaries([]);
      }

      // ═══ Step 2: Fetch real KPI data from API (parallel calls) ═══
      const isParent = clientData.client_type === 'parent';
      // Parents need GROUP: prefix for backend aggregation
      const kpiClientId = isParent ? `GROUP:${clientId}` : clientId;
      const cleanClientId = clientId;

      const kpiParams = new URLSearchParams({
        clientId: kpiClientId,
        year: '2025',
        cumulative: 'true',
      });

      const baseParams = new URLSearchParams({ clientId: cleanClientId });

      const [kpiRes, catRes, hospRes] = await Promise.all([
        fetch(`/api/proxy/getClientKPISummary?${kpiParams.toString()}`).then(r => r.json()).catch(() => null),
        fetch(`/api/proxy/getCategoriesBreakdown?${baseParams.toString()}`).then(r => r.json()).catch(() => null),
        fetch(`/api/proxy/getHospitalsData?${baseParams.toString()}`).then(r => r.json()).catch(() => null),
      ]);

      console.log(`📁 Client Folder KPI for ${clientData.client_name} (${kpiClientId}):`, {
        periods: kpiRes?.periods_matched,
        members: kpiRes?.kpis?.total_members,
        claims: kpiRes?.kpis?.total_claims,
      });

      // ═══ Step 3: Parse KPI response ═══
      const k = kpiRes?.kpis || {};
      const ct = kpiRes?.claimTypes || {};
      const mt = kpiRes?.memberTypes || {};

      const totalMembers = k.total_members || 0;
      const totalClaims = k.total_claims || 0;
      const totalCost = k.total_cost_usd || 0;
      const totalFees = k.total_fees || 0;

      const clientKpis: ClientKPIs = {
        total_members: totalMembers,
        total_claims: totalClaims,
        total_cost_usd: totalCost,
        total_fees: totalFees,
        inpatient_cases: ct.inpatient || k.inpatient_cases || 0,
        outpatient_cases: ct.outpatient || k.outpatient_cases || 0,
        exgratia_cases: ct.exgratia || k.exgratia_cases || 0,
        principal_members: mt.principal || k.principal_members || 0,
        dependent_members: mt.dependent || k.dependent_members || 0,
        new_enrollments: k.new_enrollments || 0,
        cancellations: k.cancellations || 0,
        cost_per_member: totalMembers > 0 ? totalCost / totalMembers : 0,
        utilization: totalMembers > 0 ? (totalClaims / totalMembers) * 100 : 0,
        avg_claim_cost: totalClaims > 0 ? totalCost / totalClaims : 0,
      };
      setKpis(clientKpis);

      // ═══ Step 4: Calculate financials from real data ═══
      const revenue = totalFees > 0 ? totalFees : totalCost * 1.35; // Fees or estimate
      const grossProfit = revenue - totalCost;
      const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const lossRatio = revenue > 0 ? (totalCost / revenue) * 100 : 0;
      const adminFees = revenue * 0.08; // ~8% admin
      const netProfit = grossProfit - adminFees;
      const taxRate = 0.125; // Cyprus CIT 12.5%
      const taxAmount = netProfit > 0 ? netProfit * taxRate : 0;
      const afterTaxProfit = netProfit - taxAmount;

      setFinancials({
        total_revenue: revenue,
        total_claims_cost: totalCost,
        gross_profit: grossProfit,
        profit_margin: profitMargin,
        loss_ratio: lossRatio,
        admin_fees: adminFees,
        net_profit: netProfit,
        tax_amount: taxAmount,
        after_tax_profit: afterTaxProfit,
        revenue_per_member: totalMembers > 0 ? revenue / totalMembers : 0,
        claims_per_member_cost: totalMembers > 0 ? totalCost / totalMembers : 0,
      });

      // ═══ Step 5: Parse categories ═══
      const parsedCategories: CategoryBreakdown[] = (catRes?.data || []).map((c: any) => ({
        category: c.category || c.name || 'Unknown',
        count: c.count || c.claims || c.total || 0,
        cost: c.cost_usd || c.cost || 0,
      }));
      setCategories(parsedCategories);

      // ═══ Step 6: Parse hospitals/providers ═══
      const parsedProviders: ProviderData[] = (hospRes?.data || []).slice(0, 10).map((h: any) => ({
        name: h.hospital || h.name || 'Unknown',
        hospital: h.hospital || h.name || 'Unknown',
        claims: h.claims || h.count || 0,
        cost: h.cost_usd || h.cost || 0,
        country: h.country || '',
      }));
      setProviders(parsedProviders);

      // ═══ Step 7: Contracts (dummy for now — will use real API in future) ═══
      setContracts([{
        contract_id: `CON-${clientId.replace('CLI-', '')}`,
        doc_type: 'ASA',
        status: clientData.status === 'active' ? 'Active' : 'Draft',
        version: '2',
        effective_date: clientData.contract_start || null,
        expiry_date: clientData.contract_end || null,
        signed_date: clientData.contract_start || null,
      }]);

    } catch (err) {
      console.error('Failed to load client folder:', err);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived: initials ──────────────────────────────────────────────
  const initials = useMemo(() => {
    if (!client) return '??';
    return client.client_name
      .split(' ')
      .map(w => w[0])
      .join('')
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
