"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
export interface FollowUpItem {
  id: string;
  client_id: string;
  client_name: string;
  offer_id?: string;
  type: "nda" | "proposal" | "decision" | "renewal" | "meeting" | "custom";
  subject: string;
  notes: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  due_date: string;
  created_date: string;
  completed_date?: string;
  reminder: boolean;
  contact_name?: string;
  contact_email?: string;
}

export interface FollowUpTemplate {
  key: string;
  label: string;
  icon: string;
  type: FollowUpItem["type"];
  defaultSubject: string;
  defaultNotes: string;
  defaultPriority: FollowUpItem["priority"];
  daysToDue: number;
}

/* ─── Constants ─── */
const TEMPLATES: FollowUpTemplate[] = [
  {
    key: "nda", label: "NDA Follow-up", icon: "\u{1F4C4}", type: "nda",
    defaultSubject: "Follow-up: NDA Signed?",
    defaultNotes: "Check if the NDA has been signed and returned. If signed, proceed to share the healthcare proposal with customized pricing.",
    defaultPriority: "high", daysToDue: 3,
  },
  {
    key: "proposal", label: "Proposal Review", icon: "\u{1F4CB}", type: "proposal",
    defaultSubject: "Follow-up: Proposal Review",
    defaultNotes: "Check if the client has reviewed the healthcare proposal. Offer to schedule a call to discuss questions or adjust pricing.",
    defaultPriority: "high", daysToDue: 5,
  },
  {
    key: "decision", label: "Decision Pending", icon: "\u231B", type: "decision",
    defaultSubject: "Follow-up: Decision Pending",
    defaultNotes: "Follow up on the client's decision regarding the healthcare program. Offer references, site visits, or alternative options.",
    defaultPriority: "medium", daysToDue: 7,
  },
  {
    key: "renewal", label: "Contract Renewal", icon: "\u{1F504}", type: "renewal",
    defaultSubject: "Contract Renewal Discussion",
    defaultNotes: "Initiate renewal discussion. Review current terms, usage, and propose updated pricing or enhanced coverage.",
    defaultPriority: "high", daysToDue: 30,
  },
  {
    key: "meeting", label: "Post-Meeting", icon: "\u{1F91D}", type: "meeting",
    defaultSubject: "Thank You - Meeting Follow-up",
    defaultNotes: "Send thank you email after meeting. Summarize key points discussed and next steps agreed upon.",
    defaultPriority: "medium", daysToDue: 1,
  },
  {
    key: "custom", label: "Custom Follow-up", icon: "\u{1F4DD}", type: "custom",
    defaultSubject: "",
    defaultNotes: "",
    defaultPriority: "medium", daysToDue: 7,
  },
];

/* ─── Demo Data ─── */
function generateDemoFollowUps(): FollowUpItem[] {
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split("T")[0];
  };

  return [
    { id: "FU-001", client_id: "CLI-001", client_name: "ELETSON", type: "nda", subject: "Follow-up: NDA Signed?", notes: "NDA sent 5 days ago, no response yet.", priority: "high", status: "overdue", due_date: d(-2), created_date: d(-7), reminder: true, contact_name: "John Papas" },
    { id: "FU-002", client_id: "CLI-003", client_name: "DIANA SHIPPING", type: "proposal", subject: "Follow-up: Proposal Review", notes: "Proposal sent last week. Client asked for time to review.", priority: "high", status: "pending", due_date: d(1), created_date: d(-5), reminder: true, contact_name: "Maria Dimitriou" },
    { id: "FU-003", client_id: "CLI-005", client_name: "MINERVA MARINE", type: "decision", subject: "Follow-up: Decision Pending", notes: "Awaiting board approval. Expected within 2 weeks.", priority: "medium", status: "pending", due_date: d(5), created_date: d(-3), reminder: true, contact_name: "Nikos Andreou" },
    { id: "FU-004", client_id: "CLI-007", client_name: "STAR BULK", type: "renewal", subject: "Contract Renewal Discussion", notes: "Contract expires in 60 days. Schedule renewal meeting.", priority: "high", status: "in_progress", due_date: d(14), created_date: d(-10), reminder: true, contact_name: "Petros Makris" },
    { id: "FU-005", client_id: "CLI-010", client_name: "EUROSEAS", type: "meeting", subject: "Post-Meeting Follow-up", notes: "Good meeting today. Client interested in Gold+ plan.", priority: "medium", status: "completed", due_date: d(-1), created_date: d(-2), completed_date: d(0), reminder: false, contact_name: "Anna Vlachou" },
    { id: "FU-006", client_id: "CLI-002", client_name: "CENTROFIN", type: "proposal", subject: "Follow-up: Updated Proposal", notes: "Client requested adjusted pricing for dental coverage.", priority: "medium", status: "pending", due_date: d(3), created_date: d(-1), reminder: true, contact_name: "George Katsaros" },
    { id: "FU-007", client_id: "CLI-008", client_name: "NAVIOS", type: "nda", subject: "NDA Reminder", notes: "Second follow-up. NDA sent 10 days ago.", priority: "high", status: "overdue", due_date: d(-4), created_date: d(-10), reminder: true, contact_name: "Dimitris Sofianos" },
    { id: "FU-008", client_id: "CLI-012", client_name: "TSAKOS ENERGY", type: "decision", subject: "Program Selection Follow-up", notes: "Client comparing Gold vs Gold+ plans.", priority: "low", status: "pending", due_date: d(10), created_date: d(-2), reminder: false, contact_name: "Eleni Tsakos" },
    { id: "FU-009", client_id: "CLI-015", client_name: "DANAOS SHIPPING", type: "renewal", subject: "Contract Renewal - Q2", notes: "Renewal meeting scheduled for next week.", priority: "high", status: "in_progress", due_date: d(7), created_date: d(-14), reminder: true, contact_name: "Ioannis Danaos" },
    { id: "FU-010", client_id: "CLI-004", client_name: "DYNACOM", type: "meeting", subject: "Meeting Notes Follow-up", notes: "Client requested crew health statistics before deciding.", priority: "medium", status: "completed", due_date: d(-5), created_date: d(-6), completed_date: d(-4), reminder: false, contact_name: "Kostas Prokopiou" },
  ];
}

/* ─── Hook ─── */
export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "calendar" | "completed">("queue");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FollowUpTemplate | null>(null);
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "client">("due_date");

  // Clients for dropdown
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Load clients
      try {
        const res = await fetch("/api/proxy/getActiveClients");
        const data = await res.json();
        const list = (data.data || []).map((c: Record<string, string>) => ({
          id: c.client_id || c.id,
          name: c.client_name || c.name,
        }));
        setClients(list);
      } catch (e) {
        console.warn("Failed to load clients:", e);
      }
      // Load follow-ups (demo for now)
      setFollowUps(generateDemoFollowUps());
      setLoading(false);
    };
    loadData();
  }, []);

  // Computed: filtered and sorted
  const filteredFollowUps = followUps.filter((fu) => {
    if (filterStatus === "active" && (fu.status === "completed" || fu.status === "cancelled")) return false;
    if (filterStatus === "completed" && fu.status !== "completed") return false;
    if (filterPriority !== "all" && fu.priority !== filterPriority) return false;
    if (filterType !== "all" && fu.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return fu.client_name.toLowerCase().includes(term) ||
             fu.subject.toLowerCase().includes(term) ||
             fu.notes.toLowerCase().includes(term);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "due_date") return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (sortBy === "priority") {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    }
    return a.client_name.localeCompare(b.client_name);
  });

  // Stats
  const stats = {
    total: followUps.filter(f => f.status !== "completed" && f.status !== "cancelled").length,
    overdue: followUps.filter(f => f.status === "overdue").length,
    dueToday: followUps.filter(f => {
      const today = new Date().toISOString().split("T")[0];
      return f.due_date === today && f.status !== "completed";
    }).length,
    dueSoon: followUps.filter(f => {
      const today = new Date();
      const due = new Date(f.due_date);
      const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 3 && f.status !== "completed";
    }).length,
    completed: followUps.filter(f => f.status === "completed").length,
    highPriority: followUps.filter(f => f.priority === "high" && f.status !== "completed").length,
  };

  // Actions
  const addFollowUp = useCallback((item: Omit<FollowUpItem, "id" | "created_date">) => {
    const newItem: FollowUpItem = {
      ...item,
      id: `FU-${String(followUps.length + 1).padStart(3, "0")}`,
      created_date: new Date().toISOString().split("T")[0],
    };
    setFollowUps((prev) => [newItem, ...prev]);
    setShowCreateModal(false);
  }, [followUps.length]);

  const updateStatus = useCallback((id: string, status: FollowUpItem["status"]) => {
    setFollowUps((prev) =>
      prev.map((fu) =>
        fu.id === id
          ? { ...fu, status, completed_date: status === "completed" ? new Date().toISOString().split("T")[0] : fu.completed_date }
          : fu
      )
    );
  }, []);

  const deleteFollowUp = useCallback((id: string) => {
    setFollowUps((prev) => prev.filter((fu) => fu.id !== id));
  }, []);

  const snooze = useCallback((id: string, days: number) => {
    setFollowUps((prev) =>
      prev.map((fu) => {
        if (fu.id !== id) return fu;
        const newDate = new Date(fu.due_date);
        newDate.setDate(newDate.getDate() + days);
        return { ...fu, due_date: newDate.toISOString().split("T")[0], status: "pending" };
      })
    );
  }, []);

  return {
    followUps: filteredFollowUps,
    allFollowUps: followUps,
    loading,
    activeTab, setActiveTab,
    filterPriority, setFilterPriority,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    searchTerm, setSearchTerm,
    showCreateModal, setShowCreateModal,
    selectedTemplate, setSelectedTemplate,
    sortBy, setSortBy,
    clients,
    stats,
    templates: TEMPLATES,
    addFollowUp,
    updateStatus,
    deleteFollowUp,
    snooze,
  };
}
