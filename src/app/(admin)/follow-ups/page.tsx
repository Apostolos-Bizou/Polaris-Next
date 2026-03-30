"use client";

import { useState } from "react";
import { useFollowUps, FollowUpItem } from "@/hooks/use-follow-ups";
import "./follow-ups.css";

/* ─── Helpers ─── */
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function priorityColor(p: string): string {
  return p === "high" ? "#e74c3c" : p === "medium" ? "#f39c12" : "#27ae60";
}

function statusColor(s: string): string {
  return s === "overdue" ? "#e74c3c" : s === "pending" ? "#f39c12" : s === "in_progress" ? "#3498db" : s === "completed" ? "#27ae60" : "#95a5a6";
}

function typeIcon(t: string): string {
  const icons: Record<string, string> = {
    nda: "\u{1F4C4}", proposal: "\u{1F4CB}", decision: "\u231B",
    renewal: "\u{1F504}", meeting: "\u{1F91D}", custom: "\u{1F4DD}",
  };
  return icons[t] || "\u{1F4DD}";
}

function typeLabel(t: string): string {
  const labels: Record<string, string> = {
    nda: "NDA", proposal: "Proposal", decision: "Decision",
    renewal: "Renewal", meeting: "Meeting", custom: "Custom",
  };
  return labels[t] || "Custom";
}

/* ─── Create Follow-up Modal ─── */
function CreateModal({ fu, onClose }: { fu: ReturnType<typeof useFollowUps>; onClose: () => void }) {
  const tpl = fu.selectedTemplate;
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [subject, setSubject] = useState(tpl?.defaultSubject || "");
  const [notes, setNotes] = useState(tpl?.defaultNotes || "");
  const [priority, setPriority] = useState<FollowUpItem["priority"]>(tpl?.defaultPriority || "medium");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (tpl?.daysToDue || 7));
    return d.toISOString().split("T")[0];
  });
  const [contactName, setContactName] = useState("");
  const [reminder, setReminder] = useState(true);

  const handleSave = () => {
    if (!clientId || !subject) {
      alert("Please select a client and enter a subject");
      return;
    }
    fu.addFollowUp({
      client_id: clientId,
      client_name: clientName,
      type: tpl?.type || "custom",
      subject,
      notes,
      priority,
      status: "pending",
      due_date: dueDate,
      reminder,
      contact_name: contactName,
    });
  };

  return (
    <div className="fu-modal-overlay" onClick={onClose}>
      <div className="fu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fu-modal-header">
          <h2>{tpl ? `${tpl.icon} ${tpl.label}` : "\u{1F4DD} New Follow-up"}</h2>
          <button className="fu-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="fu-modal-body">
          <div className="fu-form-row">
            <div className="fu-form-group" style={{ flex: 2 }}>
              <label>Client *</label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const found = fu.clients.find((c) => c.id === e.target.value);
                  if (found) setClientName(found.name);
                }}
              >
                <option value="">Select client...</option>
                {fu.clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="fu-form-group">
              <label>Contact Name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact person..." />
            </div>
          </div>
          <div className="fu-form-group">
            <label>Subject *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Follow-up subject..." />
          </div>
          <div className="fu-form-group">
            <label>Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details..." />
          </div>
          <div className="fu-form-row">
            <div className="fu-form-group">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="fu-form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as FollowUpItem["priority"])}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="fu-form-group">
              <label>Reminder</label>
              <label className="fu-toggle">
                <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
                <span className="fu-toggle-slider" />
              </label>
            </div>
          </div>
        </div>
        <div className="fu-modal-footer">
          <button className="fu-btn cancel" onClick={onClose}>Cancel</button>
          <button className="fu-btn save" onClick={handleSave}>Create Follow-up</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Follow-up Card ─── */
function FollowUpCard({ item, fu }: { item: FollowUpItem; fu: ReturnType<typeof useFollowUps> }) {
  const days = daysUntil(item.due_date);
  const isOverdue = days < 0 && item.status !== "completed";
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`fu-card ${isOverdue ? "overdue" : ""} ${item.status === "completed" ? "completed" : ""}`}>
      <div className="fu-card-main" onClick={() => setExpanded(!expanded)}>
        <div className="fu-card-left">
          <span className="fu-card-icon">{typeIcon(item.type)}</span>
          <div className="fu-card-info">
            <div className="fu-card-client">{item.client_name}</div>
            <div className="fu-card-subject">{item.subject}</div>
            {item.contact_name && <div className="fu-card-contact">Contact: {item.contact_name}</div>}
          </div>
        </div>
        <div className="fu-card-right">
          <span className="fu-badge type" style={{ background: `rgba(${item.type === "nda" ? "231,76,60" : item.type === "proposal" ? "52,152,219" : item.type === "renewal" ? "212,175,55" : "142,68,173"},0.2)` }}>
            {typeLabel(item.type)}
          </span>
          <span className="fu-badge priority" style={{ background: `${priorityColor(item.priority)}30`, color: priorityColor(item.priority) }}>
            {item.priority}
          </span>
          <span className="fu-badge status" style={{ background: `${statusColor(item.status)}25`, color: statusColor(item.status) }}>
            {item.status === "in_progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
          <div className={`fu-card-due ${isOverdue ? "overdue" : days <= 3 ? "soon" : ""}`}>
            {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="fu-card-expanded">
          <div className="fu-card-notes">{item.notes}</div>
          <div className="fu-card-meta">
            <span>Created: {formatDate(item.created_date)}</span>
            <span>Due: {formatDate(item.due_date)}</span>
            {item.completed_date && <span>Completed: {formatDate(item.completed_date)}</span>}
            {item.reminder && <span className="fu-reminder-badge">Reminder ON</span>}
          </div>
          <div className="fu-card-actions">
            {item.status !== "completed" && (
              <>
                <button className="fu-action-btn complete" onClick={(e) => { e.stopPropagation(); fu.updateStatus(item.id, "completed"); }}>
                  Mark Complete
                </button>
                <button className="fu-action-btn progress" onClick={(e) => { e.stopPropagation(); fu.updateStatus(item.id, "in_progress"); }}>
                  In Progress
                </button>
                <button className="fu-action-btn snooze" onClick={(e) => { e.stopPropagation(); fu.snooze(item.id, 3); }}>
                  Snooze 3d
                </button>
                <button className="fu-action-btn snooze" onClick={(e) => { e.stopPropagation(); fu.snooze(item.id, 7); }}>
                  Snooze 7d
                </button>
              </>
            )}
            <button className="fu-action-btn delete" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this follow-up?")) fu.deleteFollowUp(item.id); }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Calendar View ─── */
function CalendarView({ fu }: { fu: ReturnType<typeof useFollowUps> }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Group follow-ups by date
  const byDate: Record<string, FollowUpItem[]> = {};
  fu.allFollowUps.forEach((item) => {
    const d = item.due_date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(item);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="fu-cal-cell empty" />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const items = byDate[dateStr] || [];
    const isToday = dateStr === today.toISOString().split("T")[0];
    cells.push(
      <div key={d} className={`fu-cal-cell ${isToday ? "today" : ""} ${items.length ? "has-items" : ""}`}>
        <div className="fu-cal-day">{d}</div>
        {items.slice(0, 3).map((item) => (
          <div key={item.id} className={`fu-cal-item ${item.status}`} title={`${item.client_name}: ${item.subject}`}>
            <span className="fu-cal-dot" style={{ background: priorityColor(item.priority) }} />
            <span className="fu-cal-text">{item.client_name}</span>
          </div>
        ))}
        {items.length > 3 && <div className="fu-cal-more">+{items.length - 3} more</div>}
      </div>
    );
  }

  return (
    <div className="fu-calendar">
      <div className="fu-cal-nav">
        <button onClick={() => setMonthOffset((p) => p - 1)}>&lt;</button>
        <h3>{monthName}</h3>
        <button onClick={() => setMonthOffset((p) => p + 1)}>&gt;</button>
      </div>
      <div className="fu-cal-header">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="fu-cal-dayname">{d}</div>
        ))}
      </div>
      <div className="fu-cal-grid">{cells}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function FollowUpsPage() {
  const fu = useFollowUps();

  if (fu.loading) {
    return (
      <div className="fu-page">
        <div className="fu-loading">Loading follow-ups...</div>
      </div>
    );
  }

  return (
    <div className="fu-page">
      {/* Header */}
      <div className="fu-header">
        <div>
          <h1 className="fu-title">{"\u{1F4CB}"} Follow-ups Management</h1>
          <p className="fu-subtitle">Track and manage client follow-ups, reminders, and pending actions</p>
        </div>
        <button className="fu-new-btn" onClick={() => { fu.setSelectedTemplate(null); fu.setShowCreateModal(true); }}>
          + New Follow-up
        </button>
      </div>

      {/* KPI Stats */}
      <div className="fu-stats-grid">
        <div className="fu-stat-card">
          <div className="fu-stat-value" style={{ color: "#3498db" }}>{fu.stats.total}</div>
          <div className="fu-stat-label">Active</div>
        </div>
        <div className="fu-stat-card alert">
          <div className="fu-stat-value" style={{ color: "#e74c3c" }}>{fu.stats.overdue}</div>
          <div className="fu-stat-label">Overdue</div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-value" style={{ color: "#f39c12" }}>{fu.stats.dueToday + fu.stats.dueSoon}</div>
          <div className="fu-stat-label">Due Soon</div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-value" style={{ color: "#e74c3c" }}>{fu.stats.highPriority}</div>
          <div className="fu-stat-label">High Priority</div>
        </div>
        <div className="fu-stat-card">
          <div className="fu-stat-value" style={{ color: "#27ae60" }}>{fu.stats.completed}</div>
          <div className="fu-stat-label">Completed</div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="fu-section">
        <h2 className="fu-section-title">Quick Follow-up Templates</h2>
        <div className="fu-templates-grid">
          {fu.templates.map((tpl) => (
            <button
              key={tpl.key}
              className="fu-template-card"
              onClick={() => { fu.setSelectedTemplate(tpl); fu.setShowCreateModal(true); }}
            >
              <span className="fu-template-icon">{tpl.icon}</span>
              <span className="fu-template-label">{tpl.label}</span>
              <span className="fu-template-days">{tpl.daysToDue}d</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="fu-tabs">
        <button className={`fu-tab ${fu.activeTab === "queue" ? "active" : ""}`} onClick={() => { fu.setActiveTab("queue"); fu.setFilterStatus("active"); }}>
          Queue <span className="fu-tab-badge">{fu.stats.total}</span>
        </button>
        <button className={`fu-tab ${fu.activeTab === "calendar" ? "active" : ""}`} onClick={() => fu.setActiveTab("calendar")}>
          Calendar
        </button>
        <button className={`fu-tab ${fu.activeTab === "completed" ? "active" : ""}`} onClick={() => { fu.setActiveTab("completed"); fu.setFilterStatus("completed"); }}>
          Completed <span className="fu-tab-badge green">{fu.stats.completed}</span>
        </button>
      </div>

      {/* Filters (queue & completed tabs) */}
      {fu.activeTab !== "calendar" && (
        <div className="fu-filters">
          <input
            className="fu-search"
            placeholder="Search clients, subjects..."
            value={fu.searchTerm}
            onChange={(e) => fu.setSearchTerm(e.target.value)}
          />
          <select className="fu-filter-select" value={fu.filterType} onChange={(e) => fu.setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="nda">NDA</option>
            <option value="proposal">Proposal</option>
            <option value="decision">Decision</option>
            <option value="renewal">Renewal</option>
            <option value="meeting">Meeting</option>
          </select>
          <select className="fu-filter-select" value={fu.filterPriority} onChange={(e) => fu.setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="fu-filter-select" value={fu.sortBy} onChange={(e) => fu.setSortBy(e.target.value as "due_date" | "priority" | "client")}>
            <option value="due_date">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="client">Sort: Client</option>
          </select>
        </div>
      )}

      {/* Content */}
      {fu.activeTab === "calendar" ? (
        <CalendarView fu={fu} />
      ) : (
        <div className="fu-list">
          {fu.followUps.length === 0 ? (
            <div className="fu-empty">No follow-ups found</div>
          ) : (
            fu.followUps.map((item) => (
              <FollowUpCard key={item.id} item={item} fu={fu} />
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {fu.showCreateModal && (
        <CreateModal fu={fu} onClose={() => fu.setShowCreateModal(false)} />
      )}
    </div>
  );
}
