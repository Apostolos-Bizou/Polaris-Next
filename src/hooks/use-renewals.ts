'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface RenewalKPIs {
  total_members: number;
  annual_revenue: number;
  pending_offers: number;
  expiring_contracts: number;
}

export interface PipelineOffer {
  offer_id: string;
  client_name: string;
  client_id: string;
  status: string; // draft, sent, followup1, followup2, followup3, accepted
  total_amount: number;
  total_members: number;
  created_at: string;
  days_since: number;
  urgency: 'normal' | 'warning' | 'urgent';
}

export interface ExpiringContract {
  client_id: string;
  client_name: string;
  contract_id: string;
  contract_type: string;
  member_count: number;
  expiry_date: string;
  days_until: number;
  urgency: 'critical' | 'warning' | 'ok';
  status: string;
}

export interface RenewalNote {
  id: string;
  client_id: string;
  client_name: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'followup';
  content: string;
  created_at: string;
  created_by: string;
  // Todo/Reminder fields
  reminder_date?: string;
  reminder_time?: string;
  completed?: boolean;
  archived?: boolean;
}

export interface CalendarMonth {
  month: number; // 0-11
  year: number;
  label: string; // "Jan", "Feb" etc
  contracts: ExpiringContract[];
  isCurrentMonth: boolean;
}

export interface ActionItem {
  id: string;
  type: 'overdue' | 'call_today' | 'expiring' | 'send_renewal';
  label: string;
  client_name: string;
  client_id: string;
  detail: string;
  urgency: 'high' | 'medium' | 'low';
}

export type PipelineStage = 'draft' | 'sent' | 'followup1' | 'followup2' | 'followup3' | 'accepted';
export type ExpiringFilter = 30 | 60 | 90;

// ─── Demo Data ────────────────────────────────────────────────────
function generateDemoPipeline(): PipelineOffer[] {
  const now = Date.now();
  const day = 86400000;

  return [
    { offer_id: 'OFF-2026-0012', client_name: 'ELETSON HOLDINGS', client_id: 'CLI-2026-0001', status: 'draft', total_amount: 125000, total_members: 45, created_at: new Date(now - day * 3).toISOString(), days_since: 3, urgency: 'normal' },
    { offer_id: 'OFF-2026-0013', client_name: 'EFNAV S.A.', client_id: 'CLI-2026-0015', status: 'draft', total_amount: 89000, total_members: 32, created_at: new Date(now - day * 8).toISOString(), days_since: 8, urgency: 'normal' },
    { offer_id: 'OFF-2026-0008', client_name: 'CROSSWORLD MARINE', client_id: 'CLI-2026-0010', status: 'sent', total_amount: 156000, total_members: 62, created_at: new Date(now - day * 12).toISOString(), days_since: 12, urgency: 'normal' },
    { offer_id: 'OFF-2026-0009', client_name: 'GOLDEN UNION SHIPPING', client_id: 'CLI-2026-0020', status: 'sent', total_amount: 98000, total_members: 38, created_at: new Date(now - day * 5).toISOString(), days_since: 5, urgency: 'normal' },
    { offer_id: 'OFF-2026-0005', client_name: 'THENAMARIS', client_id: 'CLI-2026-0005', status: 'followup1', total_amount: 245000, total_members: 120, created_at: new Date(now - day * 18).toISOString(), days_since: 18, urgency: 'warning' },
    { offer_id: 'OFF-2026-0006', client_name: 'DIANA SHIPPING', client_id: 'CLI-2026-0008', status: 'followup1', total_amount: 178000, total_members: 85, created_at: new Date(now - day * 15).toISOString(), days_since: 15, urgency: 'warning' },
    { offer_id: 'OFF-2026-0003', client_name: 'CENTROFIN MARINE', client_id: 'CLI-2026-0003', status: 'followup2', total_amount: 312000, total_members: 145, created_at: new Date(now - day * 25).toISOString(), days_since: 25, urgency: 'warning' },
    { offer_id: 'OFF-2026-0004', client_name: 'KYKLADES MARITIME', client_id: 'CLI-2026-0030', status: 'followup3', total_amount: 67000, total_members: 28, created_at: new Date(now - day * 35).toISOString(), days_since: 35, urgency: 'urgent' },
    { offer_id: 'OFF-2026-0001', client_name: 'AIMS ADRIA SHIPHOLDING', client_id: 'CLI-2026-0002', status: 'accepted', total_amount: 198000, total_members: 92, created_at: new Date(now - day * 40).toISOString(), days_since: 40, urgency: 'normal' },
    { offer_id: 'OFF-2026-0002', client_name: 'ASTRA SHIPMANAGEMENT', client_id: 'CLI-2026-0004', status: 'accepted', total_amount: 145000, total_members: 68, created_at: new Date(now - day * 30).toISOString(), days_since: 30, urgency: 'normal' },
  ];
}

function generateDemoExpiring(): ExpiringContract[] {
  const now = Date.now();
  const day = 86400000;

  return [
    // Within 90 days
    { client_id: 'CLI-2026-0030', client_name: 'KYKLADES MARITIME', contract_id: 'ASA-2024-030', contract_type: 'ASA', member_count: 85, expiry_date: new Date(now + day * 12).toISOString(), days_until: 12, urgency: 'critical', status: 'active' },
    { client_id: 'CLI-2026-0015', client_name: 'EFNAV S.A.', contract_id: 'ASA-2024-015', contract_type: 'ASA', member_count: 45, expiry_date: new Date(now + day * 22).toISOString(), days_until: 22, urgency: 'critical', status: 'active' },
    { client_id: 'CLI-2026-0020', client_name: 'GOLDEN UNION SHIPPING', contract_id: 'ASA-2024-020', contract_type: 'ASA', member_count: 112, expiry_date: new Date(now + day * 28).toISOString(), days_until: 28, urgency: 'critical', status: 'active' },
    { client_id: 'CLI-2026-0010', client_name: 'CROSSWORLD MARINE', contract_id: 'ASA-2024-010', contract_type: 'ASA', member_count: 62, expiry_date: new Date(now + day * 38).toISOString(), days_until: 38, urgency: 'warning', status: 'active' },
    { client_id: 'CLI-2026-0008', client_name: 'DIANA SHIPPING', contract_id: 'ASA-2024-008', contract_type: 'ASA', member_count: 95, expiry_date: new Date(now + day * 45).toISOString(), days_until: 45, urgency: 'warning', status: 'active' },
    { client_id: 'CLI-2026-0005', client_name: 'THENAMARIS', contract_id: 'ASA-2024-005', contract_type: 'ASA', member_count: 120, expiry_date: new Date(now + day * 55).toISOString(), days_until: 55, urgency: 'warning', status: 'active' },
    { client_id: 'CLI-2026-0001', client_name: 'ELETSON HOLDINGS', contract_id: 'ASA-2024-001', contract_type: 'ASA', member_count: 78, expiry_date: new Date(now + day * 68).toISOString(), days_until: 68, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0003', client_name: 'CENTROFIN MARINE', contract_id: 'ASA-2024-003', contract_type: 'ASA', member_count: 145, expiry_date: new Date(now + day * 75).toISOString(), days_until: 75, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0004', client_name: 'ASTRA SHIPMANAGEMENT', contract_id: 'ASA-2024-004', contract_type: 'ASA', member_count: 68, expiry_date: new Date(now + day * 82).toISOString(), days_until: 82, urgency: 'ok', status: 'active' },
    // Future months (for calendar view)
    { client_id: 'CLI-2026-0025', client_name: 'MARINE TRUST LTD', contract_id: 'ASA-2024-025', contract_type: 'ASA', member_count: 55, expiry_date: '2026-07-15T00:00:00Z', days_until: 108, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0012', client_name: 'AEGEAN BULK CO.', contract_id: 'ASA-2024-012', contract_type: 'ASA', member_count: 92, expiry_date: '2026-07-28T00:00:00Z', days_until: 121, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0018', client_name: 'NAVIOS MARITIME', contract_id: 'ASA-2024-018', contract_type: 'ASA', member_count: 135, expiry_date: '2026-08-10T00:00:00Z', days_until: 134, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0022', client_name: 'BLUE STAR FERRIES', contract_id: 'ASA-2024-022', contract_type: 'ASA', member_count: 210, expiry_date: '2026-09-01T00:00:00Z', days_until: 156, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0028', client_name: 'PANTHEON TANKERS', contract_id: 'ASA-2024-028', contract_type: 'ASA', member_count: 88, expiry_date: '2026-09-20T00:00:00Z', days_until: 175, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0035', client_name: 'EASTERN MEDITERRANEAN', contract_id: 'ASA-2024-035', contract_type: 'ASA', member_count: 67, expiry_date: '2026-10-05T00:00:00Z', days_until: 190, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0040', client_name: 'PIRAEUS SHIPPING', contract_id: 'ASA-2024-040', contract_type: 'ASA', member_count: 42, expiry_date: '2026-11-12T00:00:00Z', days_until: 228, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0042', client_name: 'HELLENIC CARRIERS', contract_id: 'ASA-2024-042', contract_type: 'ASA', member_count: 73, expiry_date: '2026-11-25T00:00:00Z', days_until: 241, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0045', client_name: 'ALPHA GAS CARRIER', contract_id: 'ASA-2024-045', contract_type: 'ASA', member_count: 58, expiry_date: '2026-12-08T00:00:00Z', days_until: 254, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0048', client_name: 'CAPE SHIPPING', contract_id: 'ASA-2024-048', contract_type: 'ASA', member_count: 95, expiry_date: '2027-01-15T00:00:00Z', days_until: 292, urgency: 'ok', status: 'active' },
    { client_id: 'CLI-2026-0050', client_name: 'OMEGA NAVIGATION', contract_id: 'ASA-2024-050', contract_type: 'ASA', member_count: 48, expiry_date: '2027-02-20T00:00:00Z', days_until: 328, urgency: 'ok', status: 'active' },
  ];
}

function generateDemoNotes(): RenewalNote[] {
  const now = Date.now();
  const day = 86400000;

  return [
    { id: 'n1', client_id: 'CLI-2026-0005', client_name: 'THENAMARIS', type: 'call', content: 'Spoke with Mr. Papadopoulos - reviewing premium adjustment. Will respond by next week.', created_at: new Date(now - day * 1).toISOString(), created_by: 'Admin' },
    { id: 'n2', client_id: 'CLI-2026-0010', client_name: 'CROSSWORLD MARINE', type: 'email', content: 'Sent renewal proposal with updated coverage terms. Awaiting feedback from CEO Simos Varias.', created_at: new Date(now - day * 2).toISOString(), created_by: 'Admin' },
    { id: 'n3', client_id: 'CLI-2026-0030', client_name: 'KYKLADES MARITIME', type: 'followup', content: 'URGENT: Contract expires in 12 days. Client has not responded to 3 follow-ups. Escalate to management.', created_at: new Date(now - day * 3).toISOString(), created_by: 'Admin' },
    { id: 'n4', client_id: 'CLI-2026-0003', client_name: 'CENTROFIN MARINE', type: 'meeting', content: 'Meeting scheduled for April 5th to discuss renewal terms and member additions.', created_at: new Date(now - day * 4).toISOString(), created_by: 'Admin' },
    { id: 'n5', client_id: 'CLI-2026-0020', client_name: 'GOLDEN UNION SHIPPING', type: 'note', content: 'Client requested additional dental coverage in renewal. Preparing updated offer.', created_at: new Date(now - day * 5).toISOString(), created_by: 'Admin' },
    { id: 'n6', client_id: 'CLI-2026-0002', client_name: 'AIMS ADRIA SHIPHOLDING', type: 'email', content: 'Renewal accepted! Contract signed and returned. Processing new terms effective May 1st.', created_at: new Date(now - day * 7).toISOString(), created_by: 'Admin' },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════
export function useRenewals() {
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineOffer[]>([]);
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [notes, setNotes] = useState<RenewalNote[]>([]);
  const [expiringFilter, setExpiringFilter] = useState<ExpiringFilter>(30);
  const [activeSection, setActiveSection] = useState<'pipeline' | 'expiring' | 'notes' | 'actions' | 'calendar'>('pipeline');

  // Note form
  const [noteClient, setNoteClient] = useState('');
  const [noteType, setNoteType] = useState<RenewalNote['type']>('note');
  const [noteContent, setNoteContent] = useState('');
  const [noteFilter, setNoteFilter] = useState<RenewalNote['type'] | 'all'>('all');
  const [noteSearch, setNoteSearch] = useState('');
  const [noteReminderDate, setNoteReminderDate] = useState('');
  const [noteReminderTime, setNoteReminderTime] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Quick Email state
  const [emailClient, setEmailClient] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Expiring filter
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // All clients for dropdown (parents + subsidiaries)
  const [allClients, setAllClients] = useState<{ id: string; name: string; isChild: boolean }[]>([]);

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Fetch all clients from API for dropdown
      try {
        const res = await fetch('/api/proxy/getClients');
        const data = await res.json();
        if (data.success && data.data) {
          const clients = data.data;
          // Organize hierarchically: parents first, then children indented
          const parents = clients.filter((c: any) => !c.parent_client_id);
          const children = clients.filter((c: any) => c.parent_client_id);
          const organized: { id: string; name: string; isChild: boolean }[] = [];
          parents.forEach((p: any) => {
            organized.push({ id: p.client_id || '', name: p.client_name || '', isChild: false });
            children
              .filter((c: any) => c.parent_client_id === p.client_id)
              .forEach((c: any) => {
                organized.push({ id: c.client_id || '', name: c.client_name || '', isChild: true });
              });
          });
          // Add orphan children (no parent found)
          children
            .filter((c: any) => !parents.some((p: any) => p.client_id === c.parent_client_id))
            .forEach((c: any) => {
              organized.push({ id: c.client_id || '', name: c.client_name || '', isChild: true });
            });
          setAllClients(organized);
        }
      } catch { /* fallback to contracts list */ }

      // TODO: In production, fetch from API:
      // /api/proxy/getOffers → pipeline
      // /api/proxy/getExpiringContracts → contracts
      // /api/proxy/getRenewalNotes → notes
      await new Promise(r => setTimeout(r, 400));
      setPipeline(generateDemoPipeline());
      setContracts(generateDemoExpiring());
      setNotes(generateDemoNotes());
      setLoading(false);
    }
    load();
  }, []);

  // ═══ KPIs ═══
  const kpis = useMemo((): RenewalKPIs => {
    const totalMembers = contracts.reduce((sum, c) => sum + c.member_count, 0);
    const annualRevenue = totalMembers * 85; // approx $85/member
    const pendingOffers = pipeline.filter(o => o.status !== 'accepted').length;
    const expiringContracts = contracts.filter(c => c.days_until <= 90).length;
    return { total_members: totalMembers, annual_revenue: annualRevenue, pending_offers: pendingOffers, expiring_contracts: expiringContracts };
  }, [pipeline, contracts]);

  // ═══ Pipeline by stage ═══
  const pipelineByStage = useMemo(() => {
    const stages: Record<PipelineStage, PipelineOffer[]> = {
      draft: [], sent: [], followup1: [], followup2: [], followup3: [], accepted: [],
    };
    pipeline.forEach(o => {
      const s = o.status as PipelineStage;
      if (stages[s]) stages[s].push(o);
    });
    return stages;
  }, [pipeline]);

  // Pipeline totals
  const pipelineTotals = useMemo(() => {
    const active = pipeline.filter(o => o.status !== 'accepted');
    return {
      total_offers: pipeline.length,
      active_offers: active.length,
      total_members: pipeline.reduce((s, o) => s + o.total_members, 0),
      total_value: pipeline.reduce((s, o) => s + o.total_amount, 0),
      active_value: active.reduce((s, o) => s + o.total_amount, 0),
    };
  }, [pipeline]);

  // Pipeline bar chart data
  const pipelineBars = useMemo(() => {
    const stages: { key: PipelineStage; label: string; icon: string; color: string }[] = [
      { key: 'draft', label: 'Draft', icon: '📝', color: '#607D8B' },
      { key: 'sent', label: 'Sent', icon: '📤', color: '#2196F3' },
      { key: 'followup1', label: 'Follow-up 1', icon: '📞', color: '#9C27B0' },
      { key: 'followup2', label: 'Follow-up 2', icon: '📞', color: '#FF9800' },
      { key: 'followup3', label: 'Follow-up 3', icon: '🔥', color: '#F44336' },
      { key: 'accepted', label: 'Accepted', icon: '✅', color: '#4CAF50' },
    ];
    const maxCount = Math.max(...stages.map(s => pipelineByStage[s.key].length), 1);
    return stages.map(s => ({
      ...s,
      count: pipelineByStage[s.key].length,
      percentage: (pipelineByStage[s.key].length / maxCount) * 100,
    }));
  }, [pipelineByStage]);

  // ═══ Expiring contracts filtered ═══
  const filteredExpiring = useMemo(() => {
    return contracts
      .filter(c => c.days_until <= expiringFilter && c.days_until > 0)
      .sort((a, b) => a.days_until - b.days_until);
  }, [contracts, expiringFilter]);

  const expiringCounts = useMemo(() => ({
    d30: contracts.filter(c => c.days_until <= 30 && c.days_until > 0).length,
    d60: contracts.filter(c => c.days_until <= 60 && c.days_until > 0).length,
    d90: contracts.filter(c => c.days_until <= 90 && c.days_until > 0).length,
    m30: contracts.filter(c => c.days_until <= 30 && c.days_until > 0).reduce((s, c) => s + c.member_count, 0),
    m60: contracts.filter(c => c.days_until <= 60 && c.days_until > 0).reduce((s, c) => s + c.member_count, 0),
    m90: contracts.filter(c => c.days_until <= 90 && c.days_until > 0).reduce((s, c) => s + c.member_count, 0),
  }), [contracts]);

  // ═══ Action items ═══
  const actionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];

    // Overdue follow-ups
    pipeline.filter(o => o.status === 'followup2' || o.status === 'followup3').forEach(o => {
      items.push({
        id: `action-overdue-${o.offer_id}`,
        type: 'overdue',
        label: '🔴 Follow-up Overdue',
        client_name: o.client_name,
        client_id: o.client_id,
        detail: `${o.days_since} days since offer sent — $${o.total_amount.toLocaleString()}`,
        urgency: 'high',
      });
    });

    // Call today
    pipeline.filter(o => o.status === 'followup1').forEach(o => {
      items.push({
        id: `action-call-${o.offer_id}`,
        type: 'call_today',
        label: '📞 Call Today',
        client_name: o.client_name,
        client_id: o.client_id,
        detail: `First follow-up — ${o.total_members} members, $${o.total_amount.toLocaleString()}`,
        urgency: 'medium',
      });
    });

    // Expiring soon
    contracts.filter(c => c.days_until <= 30 && c.days_until > 0).forEach(c => {
      items.push({
        id: `action-expiring-${c.contract_id}`,
        type: 'expiring',
        label: '⏰ Contract Expiring',
        client_name: c.client_name,
        client_id: c.client_id,
        detail: `${c.days_until} days — ${c.member_count} members at risk`,
        urgency: c.days_until <= 14 ? 'high' : 'medium',
      });
    });

    // Draft offers to send
    pipeline.filter(o => o.status === 'draft' && o.days_since > 5).forEach(o => {
      items.push({
        id: `action-send-${o.offer_id}`,
        type: 'send_renewal',
        label: '📤 Send Renewal Offer',
        client_name: o.client_name,
        client_id: o.client_id,
        detail: `Draft ready for ${o.days_since} days — $${o.total_amount.toLocaleString()}`,
        urgency: 'low',
      });
    });

    return items.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [pipeline, contracts]);

  const actionCounts = useMemo(() => ({
    overdue: actionItems.filter(a => a.type === 'overdue').length,
    call_today: actionItems.filter(a => a.type === 'call_today').length,
    expiring: actionItems.filter(a => a.type === 'expiring').length,
    send_renewal: actionItems.filter(a => a.type === 'send_renewal').length,
  }), [actionItems]);

  // ═══ Add note ═══
  const addNote = useCallback(() => {
    if (!noteClient || !noteContent.trim()) return;
    const clientName = noteClient.split('|')[1] || noteClient;
    const clientId = noteClient.split('|')[0] || noteClient;
    const newNote: RenewalNote = {
      id: `n-${Date.now()}`,
      client_id: clientId,
      client_name: clientName,
      type: noteType,
      content: noteContent,
      created_at: new Date().toISOString(),
      created_by: 'Admin',
      reminder_date: noteReminderDate || undefined,
      reminder_time: noteReminderTime || undefined,
      completed: false,
      archived: false,
    };
    setNotes(prev => [newNote, ...prev]);
    setNoteContent('');
    setNoteClient('');
    setNoteType('note');
    setNoteReminderDate('');
    setNoteReminderTime('');
  }, [noteClient, noteType, noteContent, noteReminderDate, noteReminderTime]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleNoteComplete = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  }, []);

  const archiveNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  }, []);

  const unarchiveNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, archived: false } : n));
  }, []);

  // ═══ Filtered notes ═══
  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => showArchived ? n.archived : !n.archived);
    if (noteFilter !== 'all') {
      result = result.filter(n => n.type === noteFilter);
    }
    if (noteSearch) {
      const q = noteSearch.toLowerCase();
      result = result.filter(n =>
        n.client_name.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, noteFilter, noteSearch, showArchived]);

  // ═══ Upcoming reminders (sorted by date) ═══
  const upcomingReminders = useMemo(() => {
    return notes
      .filter(n => n.reminder_date && !n.completed && !n.archived)
      .sort((a, b) => {
        const da = new Date(`${a.reminder_date}T${a.reminder_time || '09:00'}`).getTime();
        const db = new Date(`${b.reminder_date}T${b.reminder_time || '09:00'}`).getTime();
        return da - db;
      });
  }, [notes]);

  // ═══ Last note per client ═══
  const lastNoteByClient = useMemo(() => {
    const map: Record<string, RenewalNote> = {};
    notes.filter(n => !n.archived).forEach(n => {
      if (!map[n.client_id]) map[n.client_id] = n;
    });
    return map;
  }, [notes]);

  // ═══ Calendar data — 12 months ═══
  const calendarData = useMemo((): CalendarMonth[] => {
    const now = new Date();
    const months: CalendarMonth[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const contractsInMonth = contracts.filter(c => {
        const exp = new Date(c.expiry_date);
        return exp.getMonth() === month && exp.getFullYear() === year;
      });
      months.push({
        month,
        year,
        label: monthNames[month],
        contracts: contractsInMonth.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()),
        isCurrentMonth: month === now.getMonth() && year === now.getFullYear(),
      });
    }
    return months;
  }, [contracts]);

  // ═══ Quick Email Templates ═══
  const emailTemplates = useMemo(() => [
    { id: 'renewal_01', name: 'Renewal Reminder', category: 'renewal' },
    { id: 'contract_01', name: 'Contract Documents', category: 'contract' },
    { id: 'welcome_01', name: 'Welcome Email', category: 'client' },
    { id: 'balance_01', name: 'Outstanding Balance', category: 'finance' },
    { id: 'revolving_01', name: 'Revolving Fund Alert', category: 'finance' },
    { id: 'meeting_01', name: 'Meeting Follow-up', category: 'client' },
  ], []);

  // ═══ Send Quick Email ═══
  const sendQuickEmail = useCallback(async () => {
    if (!emailClient || !emailSubject.trim()) return;
    setEmailSending(true);
    try {
      // TODO: In production, call /api/proxy/sendEmail
      await new Promise(r => setTimeout(r, 1000));
      const clientName = emailClient.split('|')[1] || emailClient;
      const clientId = emailClient.split('|')[0] || emailClient;
      // Also save as note
      const emailNote: RenewalNote = {
        id: `n-email-${Date.now()}`,
        client_id: clientId,
        client_name: clientName,
        type: 'email',
        content: `📧 Email sent: "${emailSubject}" to ${emailRecipient || 'client'}`,
        created_at: new Date().toISOString(),
        created_by: 'Admin',
      };
      setNotes(prev => [emailNote, ...prev]);
      setEmailClient('');
      setEmailTemplate('');
      setEmailRecipient('');
      setEmailSubject('');
      setEmailMessage('');
    } catch { /* empty */ }
    setEmailSending(false);
  }, [emailClient, emailSubject, emailRecipient]);

  // ═══ Save as Note (from email form) ═══
  const saveEmailAsNote = useCallback(() => {
    if (!emailClient || !emailMessage.trim()) return;
    const clientName = emailClient.split('|')[1] || emailClient;
    const clientId = emailClient.split('|')[0] || emailClient;
    const newNote: RenewalNote = {
      id: `n-${Date.now()}`,
      client_id: clientId,
      client_name: clientName,
      type: 'note',
      content: emailMessage,
      created_at: new Date().toISOString(),
      created_by: 'Admin',
    };
    setNotes(prev => [newNote, ...prev]);
    setEmailClient('');
    setEmailTemplate('');
    setEmailRecipient('');
    setEmailSubject('');
    setEmailMessage('');
  }, [emailClient, emailMessage]);

  // ═══ Clear email form ═══
  const clearEmailForm = useCallback(() => {
    setEmailClient('');
    setEmailTemplate('');
    setEmailRecipient('');
    setEmailSubject('');
    setEmailMessage('');
  }, []);

  // ═══ Refresh pipeline ═══
  const refreshPipeline = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setPipeline(generateDemoPipeline());
    setLoading(false);
  }, []);

  return {
    loading,
    kpis,
    // Pipeline
    pipeline, pipelineByStage, pipelineTotals, pipelineBars, refreshPipeline,
    // Expiring
    contracts, filteredExpiring, expiringFilter, setExpiringFilter, expiringCounts,
    showActiveOnly, setShowActiveOnly,
    // Notes
    notes, filteredNotes, addNote, deleteNote, lastNoteByClient,
    toggleNoteComplete, archiveNote, unarchiveNote, upcomingReminders,
    noteClient, setNoteClient, noteType, setNoteType, noteContent, setNoteContent,
    noteFilter, setNoteFilter, noteSearch, setNoteSearch,
    noteReminderDate, setNoteReminderDate, noteReminderTime, setNoteReminderTime,
    showArchived, setShowArchived,
    // Calendar
    calendarData,
    // Quick Email
    emailClient, setEmailClient, emailTemplate, setEmailTemplate,
    emailRecipient, setEmailRecipient, emailSubject, setEmailSubject,
    emailMessage, setEmailMessage, emailSending,
    emailTemplates, sendQuickEmail, saveEmailAsNote, clearEmailForm,
    // Actions
    actionItems, actionCounts,
    // All clients for dropdown
    allClients,
    // Section nav
    activeSection, setActiveSection,
  };
}
