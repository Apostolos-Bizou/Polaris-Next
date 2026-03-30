"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
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

/* ─── Stage mapping ─── */
const STAGE_ORDER = ["draft", "sent", "followup1", "followup2", "followup3", "accepted"];
const STAGE_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", followup1: "Follow-up 1",
  followup2: "Follow-up 2", followup3: "Follow-up 3", accepted: "Accepted",
};
const STAGE_COLORS: Record<string, string> = {
  draft: "#6c757d", sent: "#2196F3", followup1: "#9c27b0",
  followup2: "#FF9800", followup3: "#f44336", accepted: "#4CAF50",
};

function normalizeStage(status: string): string {
  const s = (status || "").toLowerCase().replace(/[\s-_]+/g, "");
  if (s.includes("draft")) return "draft";
  if (s.includes("sent")) return "sent";
  if (s.includes("followup1") || s === "followup1" || s === "follow-up1") return "followup1";
  if (s.includes("followup2") || s === "followup2") return "followup2";
  if (s.includes("followup3") || s === "followup3") return "followup3";
  if (s.includes("accept") || s.includes("won") || s.includes("active")) return "accepted";
  if (s.includes("follow")) return "followup1";
  return "draft";
}

/* ─── Demo expiring contracts ─── */
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

/* ─── Demo notes ─── */
function generateNotes(): QuickNote[] {
  return [
    { id: "N1", client: "ELETSON", text: "NDA signed, waiting for proposal review", date: "2026-03-29", type: "note" },
    { id: "N2", client: "DIANA SHIPPING", text: "Called Maria - interested in Gold+ upgrade", date: "2026-03-28", type: "call" },
    { id: "N3", client: "MINERVA MARINE", text: "Board meeting next week, decision expected", date: "2026-03-27", type: "meeting" },
  ];
}

/* ─── Hook ─── */
export function useFollowUpDashboard() {
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineOffer[]>([]);
  const [expiring, setExpiring] = useState<ExpiringContract[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>(generateNotes());
  const [expiringFilter, setExpiringFilter] = useState(30);

  // Clients for dropdown
  const [clients, setClients] = useState<Array<{ id: string; name: string; isParent?: boolean }>>([]);

  // Quick email state
  const [emailClient, setEmailClient] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // New note
  const [newNoteClient, setNewNoteClient] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Load clients
      try {
        const res = await fetch("/api/proxy/getActiveClients");
        const data = await res.json();
        const raw = data.data || [];
        // Build grouped list
        const parents: Record<string, string[]> = {};
        const standalone: Array<{ id: string; name: string }> = [];
        raw.forEach((c: any) => {
          const id = c.client_id || c.id;
          const name = c.client_name || c.name;
          const parentId = c.parent_id || c.parent_client_id;
          if (parentId && parentId !== id) {
            if (!parents[parentId]) parents[parentId] = [];
            parents[parentId].push(name);
          }
          standalone.push({ id, name });
        });
        setClients(standalone);
      } catch (e) { console.warn("Clients:", e); }

      // Load offers for pipeline
      try {
        const res = await fetch("/api/proxy/getOffers");
        const data = await res.json();
        const offers = data.data || data.offers || [];
        const mapped: PipelineOffer[] = offers.map((o: any) => ({
          offer_id: o.offer_id || o.id || "",
          client_name: o.client_name || o.company || "",
          client_id: o.client_id || "",
          status: o.status || "draft",
          stage: normalizeStage(o.status || "draft"),
          members: Number(o.members || o.total_members || 0),
          value: Number(o.value || o.annual_value || o.premium || 0),
          created_date: o.created_date || o.date || "",
          last_note: o.last_note || o.notes || "",
          next_action: o.next_action || "",
          contact_name: o.contact_name || "",
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

  // KPIs
  const totalMembers = pipeline.reduce((s, o) => s + o.members, 0);
  const totalValue = pipeline.reduce((s, o) => s + o.value, 0);
  const pendingOffers = pipeline.filter((o) => o.stage !== "accepted" && o.stage !== "draft").length;
  const expiringCount = expiring.filter((e) => e.days_left <= 90).length;

  // Action items
  const actionItems: ActionItem[] = [
    { icon: "\u26A0\uFE0F", text: "Follow-up overdue", count: pipeline.filter((o) => o.stage === "followup3").length, color: "#f44336" },
    { icon: "\u{1F4DE}", text: "Call today", count: pipeline.filter((o) => o.stage === "followup1" || o.stage === "followup2").length, color: "#FF9800" },
    { icon: "\u{1F4CB}", text: "Contracts expiring", count: expiring.filter((e) => e.days_left <= 30).length, color: "#e74c3c" },
    { icon: "\u{1F4E7}", text: "Send renewal", count: expiring.filter((e) => e.days_left <= 60 && e.days_left > 30).length, color: "#2196F3" },
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
    clients,
    emailClient, setEmailClient, emailTemplate, setEmailTemplate,
    emailSubject, setEmailSubject, emailBody, setEmailBody,
    STAGE_ORDER, STAGE_LABELS, STAGE_COLORS,
  };
}
