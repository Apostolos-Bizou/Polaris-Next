"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/* --- Types --- */
export interface PipelineOffer {
  offer_id: string;
  client_name: string;
  client_id: string;
  status: string;
  stage: string;
  members: number;
  value: number;
  created_date: string;
  last_note: string;
  next_action: string;
  contact_name?: string;
  contact_email?: string;
}

export interface ExpiringContract {
  client_name: string;
  contract_name: string;
  members: number;
  expires: string;
  days_left: number;
}

export interface ActionItem {
  icon: string;
  text: string;
  count: number;
  color: string;
}

export interface QuickNote {
  id: string;
  client: string;
  text: string;
  date: string;
  type: "note" | "call" | "email" | "meeting";
}

export interface ClientItem {
  id: string;
  name: string;
  client_type?: string;
  parent_client_id?: string | null;
}

export interface GroupedClient {
  parent: ClientItem;
  subsidiaries: ClientItem[];
}

/* --- Clean client name (remove emoji prefixes) --- */
function cleanName(name: string): string {
  return (name || "")
    .replace(/^[\s]*[\u{1F3DB}\u{1F3E2}\u2514\u2500\u{1F4C1}─└\s\uFE0F]+/gu, "")
    .replace(/\s*\[MOTHER.*?\]/gi, "")
    .replace(/\s*\[sub of.*?\]/gi, "")
    .trim();
}

/* --- Stage mapping from real API status values --- */
const STAGE_ORDER = ["draft", "sent", "pending_signature", "followup", "accepted", "signed"];
const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  pending_signature: "Pending Sign",
  followup: "Follow-up",
  accepted: "Accepted",
  signed: "Signed/Active",
};
const STAGE_COLORS: Record<string, string> = {
  draft: "#6c757d",
  sent: "#2196F3",
  pending_signature: "#9c27b0",
  followup: "#FF9800",
  accepted: "#4CAF50",
  signed: "#26A69A",
};

function normalizeStage(status: string): string {
  const s = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (s === "draft") return "draft";
  if (s === "sent" || s === "awaiting_selection") return "sent";
  if (s === "pending_signature" || s === "pending_sign") return "pending_signature";
  if (s.includes("follow")) return "followup";
  if (s === "accepted" || s === "converted" || s === "won") return "accepted";
  if (s === "signed" || s === "active") return "signed";
  if (s === "pending") return "sent";
  return "draft";
}

/* --- Demo expiring contracts --- */
function generateExpiringContracts(): ExpiringContract[] {
  return [
    { client_name: "ELETSON", contract_name: "Gold+ Healthcare 2024", members: 2450, expires: "2026-04-15", days_left: 16 },
    { client_name: "DIANA SHIPPING", contract_name: "Platinum Plan", members: 1800, expires: "2026-04-28", days_left: 29 },
    { client_name: "NAVIOS", contract_name: "Gold Healthcare", members: 980, expires: "2026-05-10", days_left: 41 },
    { client_name: "STAR BULK", contract_name: "Gold+ with Dental", members: 3200, expires: "2026-05-25", days_left: 56 },
    { client_name: "EUROSEAS", contract_name: "Silver Plan", members: 450, expires: "2026-06-15", days_left: 77 },
    { client_name: "TSAKOS ENERGY", contract_name: "Platinum Plan", members: 2100, expires: "2026-06-28", days_left: 90 },
  ];
}

/* --- Demo notes --- */
function generateNotes(): QuickNote[] {
  return [
    { id: "N1", client: "ELETSON", text: "NDA signed, waiting for proposal review", date: "2026-03-29", type: "note" },
    { id: "N2", client: "DIANA SHIPPING", text: "Called Maria - interested in Gold+ upgrade", date: "2026-03-28", type: "call" },
    { id: "N3", client: "MINERVA MARINE", text: "Board meeting next week, decision expected", date: "2026-03-27", type: "meeting" },
  ];
}

/* --- Hook --- */
export function useFollowUpDashboard() {
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineOffer[]>([]);
  const [expiring, setExpiring] = useState<ExpiringContract[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>(generateNotes());
  const [expiringFilter, setExpiringFilter] = useState(30);

  // Raw clients from API
  const [rawClients, setRawClients] = useState<ClientItem[]>([]);

  // New note
  const [newNoteClient, setNewNoteClient] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Grouped clients for dropdown
  const groupedClients = useMemo(() => {
    const parents = rawClients.filter((c) => !c.parent_client_id || c.client_type === "parent");
    const subs = rawClients.filter((c) => c.parent_client_id && c.client_type !== "parent");

    const groups: GroupedClient[] = [];
    const usedSubIds = new Set<string>();

    parents.forEach((p) => {
      const children = subs.filter((s) => s.parent_client_id === p.id);
      children.forEach((ch) => usedSubIds.add(ch.id));
      groups.push({ parent: p, subsidiaries: children });
    });

    // Any remaining orphan subs
    subs.filter((s) => !usedSubIds.has(s.id)).forEach((s) => {
      groups.push({ parent: s, subsidiaries: [] });
    });

    groups.sort((a, b) => a.parent.name.localeCompare(b.parent.name));
    return groups;
  }, [rawClients]);

  // Flat client list (for backward compat)
  const clients = useMemo(() => rawClients.map((c) => ({ id: c.id, name: c.name })), [rawClients]);

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Load clients
      try {
        const res = await fetch("/api/proxy/getActiveClients");
        const data = await res.json();
        const raw = data.data || [];
        const mapped: ClientItem[] = raw.map((c: any) => ({
          id: c.client_id || c.id,
          name: c.client_name || c.name,
          client_type: c.client_type || (c.parent_client_id ? "subsidiary" : "parent"),
          parent_client_id: c.parent_id || c.parent_client_id || null,
        }));
        setRawClients(mapped);
      } catch (e) { console.warn("Clients:", e); }

      // Load offers for pipeline - use STATUS field, NOT stage (which is a Drive URL)
      try {
        const res = await fetch("/api/proxy/getOffers");
        const data = await res.json();
        const offers = data.data || data.offers || [];
        const mapped: PipelineOffer[] = offers.map((o: any) => ({
          offer_id: o.offer_id || o.id || "",
          client_name: cleanName(o.client_name || o.company || ""),
          client_id: o.client_id || "",
          status: o.status || "draft",
          stage: normalizeStage(o.status || "draft"),
          members: Number(o.total_members || o.members || 0),
          value: Number(o.grand_total_usd || o.value || o.annual_value || 0),
          created_date: o.created_date || o.offer_date || o.date || "",
          last_note: o.notes || o.last_note || "",
          next_action: o.next_action || "",
          contact_name: o.contact_person || o.contact_name || "",
          contact_email: o.contact_email || "",
        }));
        setPipeline(mapped);
      } catch (e) { console.warn("Offers:", e); }

      // Expiring contracts
      setExpiring(generateExpiringContracts());
      setLoading(false);
    };
    load();
  }, []);

  // Pipeline by stage
  const pipelineByStage: Record<string, PipelineOffer[]> = {};
  STAGE_ORDER.forEach((s) => { pipelineByStage[s] = []; });
  pipeline.forEach((o) => {
    const st = o.stage;
    if (pipelineByStage[st]) pipelineByStage[st].push(o);
    else pipelineByStage.draft.push(o);
  });

  // Pipeline bar data
  const maxCount = Math.max(...STAGE_ORDER.map((s) => pipelineByStage[s].length), 1);
  const pipelineBars = STAGE_ORDER.map((s) => ({
    stage: s,
    label: STAGE_LABELS[s],
    count: pipelineByStage[s].length,
    pct: (pipelineByStage[s].length / maxCount) * 100,
    color: STAGE_COLORS[s],
  }));

  // KPIs - calculated from real offer data
  const totalMembers = pipeline.reduce((s, o) => s + o.members, 0);
  const totalValue = pipeline.reduce((s, o) => s + o.value, 0);
  const pendingOffers = pipeline.filter((o) => o.stage !== "signed" && o.stage !== "draft").length;
  const expiringCount = expiring.filter((e) => e.days_left <= 90).length;

  // Action items - based on real pipeline data
  const actionItems: ActionItem[] = [
    { icon: "\u26A0\uFE0F", text: "Pending signature", count: pipeline.filter((o) => o.stage === "pending_signature").length, color: "#9c27b0" },
    { icon: "\uD83D\uDCDE", text: "Needs follow-up", count: pipeline.filter((o) => o.stage === "sent" || o.stage === "followup").length, color: "#FF9800" },
    { icon: "\uD83D\uDCCB", text: "Contracts expiring", count: expiring.filter((e) => e.days_left <= 30).length, color: "#e74c3c" },
    { icon: "\uD83D\uDCE7", text: "Send renewal", count: expiring.filter((e) => e.days_left <= 60 && e.days_left > 30).length, color: "#2196F3" },
  ];

  // Filtered expiring
  const filteredExpiring = expiring.filter((e) => e.days_left <= expiringFilter);

  // Detailed view (all pipeline offers sorted by stage)
  const detailedView = [...pipeline].sort((a, b) => {
    const ai = STAGE_ORDER.indexOf(a.stage);
    const bi = STAGE_ORDER.indexOf(b.stage);
    return ai - bi;
  });

  // Add note
  const addNote = useCallback(() => {
    if (!newNoteClient || !newNoteText) return;
    const note: QuickNote = {
      id: "N" + Date.now(),
      client: newNoteClient,
      text: newNoteText,
      date: new Date().toISOString().split("T")[0],
      type: "note",
    };
    setNotes((prev) => [note, ...prev]);
    setNewNoteText("");
  }, [newNoteClient, newNoteText]);

  return {
    loading,
    pipeline, pipelineByStage, pipelineBars,
    totalMembers, totalValue, pendingOffers, expiringCount,
    actionItems,
    expiring: filteredExpiring, expiringFilter, setExpiringFilter, allExpiring: expiring,
    detailedView,
    notes, addNote, newNoteClient, setNewNoteClient, newNoteText, setNewNoteText,
    clients, groupedClients,
    STAGE_ORDER, STAGE_LABELS, STAGE_COLORS,
  };
}
