'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface ClientOption {
  id: string;
  name: string;
  isParent?: boolean;
  isSubsidiary?: boolean;
  parentName?: string;
}

export interface ClientKPIs {
  total_members: number;
  total_claims: number;
  total_cost_usd: number;
  inpatient_cases: number;
  outpatient_cases: number;
  exgratia_cases: number;
  inpatient_cost: number;
  outpatient_cost: number;
  exgratia_cost: number;
  principal_members: number;
  dependent_members: number;
  new_enrollments: number;
  cancellations: number;
  cost_per_member: number;
  utilization: number;
  avg_claim_cost: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  cost: number;
}

export interface HospitalData {
  hospital: string;
  claims: number;
  cost: number;
}

export interface CompareClientData {
  clientId: string;
  clientName: string;
  kpis: ClientKPIs;
  categories: CategoryBreakdown[];
  hospitals: HospitalData[];
  loading: boolean;
  error: string | null;
}

// ─── Default empty KPIs ──────────────────────────────────────────
const emptyKPIs: ClientKPIs = {
  total_members: 0,
  total_claims: 0,
  total_cost_usd: 0,
  inpatient_cases: 0,
  outpatient_cases: 0,
  exgratia_cases: 0,
  inpatient_cost: 0,
  outpatient_cost: 0,
  exgratia_cost: 0,
  principal_members: 0,
  dependent_members: 0,
  new_enrollments: 0,
  cancellations: 0,
  cost_per_member: 0,
  utilization: 0,
  avg_claim_cost: 0,
};

// ─── Client list cache ───────────────────────────────────────────
let clientsCache: ClientOption[] | null = null;
let clientsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Hook ────────────────────────────────────────────────────────
export function useCompare() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [clientA, setClientA] = useState<CompareClientData | null>(null);
  const [clientB, setClientB] = useState<CompareClientData | null>(null);
  const [comparing, setComparing] = useState(false);

  // Load clients list
  useEffect(() => {
    async function loadClients() {
      // Check cache
      if (clientsCache && Date.now() - clientsCacheTime < CACHE_TTL) {
        setClients(clientsCache);
        setClientsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/proxy/getClients');
        const data = await res.json();
        
        if (data.success && data.data) {
          const mapped: ClientOption[] = data.data.map((c: any) => ({
            id: c.id || c.clientId || c.name,
            name: c.name || c.clientName || c.id,
            isParent: c.isParent || c.is_parent || false,
            isSubsidiary: c.isSubsidiary || c.is_subsidiary || false,
            parentName: c.parentName || c.parent_name || '',
          }));

          // Sort: parents first, then subsidiaries grouped under parents
          const parents = mapped.filter(c => c.isParent);
          const subs = mapped.filter(c => c.isSubsidiary);
          const standalone = mapped.filter(c => !c.isParent && !c.isSubsidiary);

          const sorted: ClientOption[] = [];
          parents.forEach(p => {
            sorted.push(p);
            subs.filter(s => s.parentName === p.name).forEach(s => sorted.push(s));
          });
          // Add standalone (not parent, not subsidiary)
          standalone.forEach(s => {
            if (!sorted.find(x => x.id === s.id)) sorted.push(s);
          });
          // Add any remaining subs that didn't match a parent
          subs.forEach(s => {
            if (!sorted.find(x => x.id === s.id)) sorted.push(s);
          });

          clientsCache = sorted;
          clientsCacheTime = Date.now();
          setClients(sorted);
        }
      } catch (err) {
        console.error('Failed to load clients for compare:', err);
      } finally {
        setClientsLoading(false);
      }
    }

    loadClients();
  }, []);

  // Fetch data for one client
  const fetchClientData = useCallback(async (clientId: string): Promise<Omit<CompareClientData, 'loading' | 'error'>> => {
    const clientName = clients.find(c => c.id === clientId)?.name || clientId;
    
    // Parallel API calls
    const [kpiRes, catRes, hospRes] = await Promise.all([
      fetch(`/api/proxy/getClientKPISummary?clientId=${encodeURIComponent(clientId)}`).then(r => r.json()).catch(() => null),
      fetch(`/api/proxy/getCategoriesBreakdown?clientId=${encodeURIComponent(clientId)}`).then(r => r.json()).catch(() => null),
      fetch(`/api/proxy/getHospitalsData?clientId=${encodeURIComponent(clientId)}`).then(r => r.json()).catch(() => null),
    ]);

    // Parse KPIs
    const k = kpiRes?.kpis || kpiRes?.data || {};
    const ct = kpiRes?.claimTypes || {};
    const mt = kpiRes?.memberTypes || {};

    const totalMembers = k.total_members || 0;
    const totalClaims = k.total_claims || 0;
    const totalCost = k.total_cost_usd || k.total_cost || 0;

    // Claim type breakdown
    const inCases = ct.cases?.inpatient || k.inpatient_cases || 0;
    const outCases = ct.cases?.outpatient || k.outpatient_cases || 0;
    const exCases = ct.cases?.exgratia || k.exgratia_cases || 0;
    
    // Convert costs if needed (PHP to USD)
    const rawInCost = ct.costs?.inpatient || k.inpatient_cost || 0;
    const rawOutCost = ct.costs?.outpatient || k.outpatient_cost || 0;
    const rawExCost = ct.costs?.exgratia || k.exgratia_cost || 0;
    const rawTotal = rawInCost + rawOutCost + rawExCost;
    const rate = (rawTotal > 0 && totalCost > 0 && rawTotal > totalCost * 2) ? totalCost / rawTotal : 1;

    const kpis: ClientKPIs = {
      total_members: totalMembers,
      total_claims: totalClaims,
      total_cost_usd: totalCost,
      inpatient_cases: inCases,
      outpatient_cases: outCases,
      exgratia_cases: exCases,
      inpatient_cost: Math.round(rawInCost * rate),
      outpatient_cost: Math.round(rawOutCost * rate),
      exgratia_cost: Math.round(rawExCost * rate),
      principal_members: mt.members?.principal || k.principal_members || 0,
      dependent_members: mt.members?.dependent || k.dependent_members || 0,
      new_enrollments: k.new_enrollments || k.enrollments || 0,
      cancellations: k.cancellations || 0,
      cost_per_member: totalMembers > 0 ? totalCost / totalMembers : 0,
      utilization: totalMembers > 0 ? (totalClaims / totalMembers) * 100 : 0,
      avg_claim_cost: totalClaims > 0 ? totalCost / totalClaims : 0,
    };

    // Categories
    const categories: CategoryBreakdown[] = (catRes?.data || []).map((c: any) => ({
      category: c.category || c.name || 'Unknown',
      count: c.count || c.claims || 0,
      cost: c.cost_usd || c.cost || 0,
    }));

    // Hospitals
    const hospitals: HospitalData[] = (hospRes?.data || []).slice(0, 10).map((h: any) => ({
      hospital: h.hospital || h.name || 'Unknown',
      claims: h.claims || h.count || 0,
      cost: h.cost_usd || h.cost || 0,
    }));

    return { clientId, clientName, kpis, categories, hospitals };
  }, [clients]);

  // Run comparison
  const runComparison = useCallback(async (idA: string, idB: string) => {
    if (!idA || !idB) return;
    
    setComparing(true);
    setClientA({ clientId: idA, clientName: clients.find(c => c.id === idA)?.name || idA, kpis: emptyKPIs, categories: [], hospitals: [], loading: true, error: null });
    setClientB({ clientId: idB, clientName: clients.find(c => c.id === idB)?.name || idB, kpis: emptyKPIs, categories: [], hospitals: [], loading: true, error: null });

    try {
      const [dataA, dataB] = await Promise.all([
        fetchClientData(idA),
        fetchClientData(idB),
      ]);

      setClientA({ ...dataA, loading: false, error: null });
      setClientB({ ...dataB, loading: false, error: null });
    } catch (err) {
      console.error('Comparison error:', err);
      setClientA(prev => prev ? { ...prev, loading: false, error: 'Failed to load data' } : null);
      setClientB(prev => prev ? { ...prev, loading: false, error: 'Failed to load data' } : null);
    } finally {
      setComparing(false);
    }
  }, [clients, fetchClientData]);

  // Clear comparison
  const clearComparison = useCallback(() => {
    setClientA(null);
    setClientB(null);
    setComparing(false);
  }, []);

  return {
    clients,
    clientsLoading,
    clientA,
    clientB,
    comparing,
    runComparison,
    clearComparison,
  };
}
