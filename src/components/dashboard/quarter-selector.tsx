"use client";

import { useMemo } from "react";
import "./quarter-selector.css";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════
export interface ClientOption {
  client_id: string;
  client_name: string;
  company_name?: string;
  client_type?: string;       // "parent" | "subsidiary"
  parent_client_id?: string | null;
  total_members?: number;
  status?: string;
}

interface QuarterSelectorProps {
  clients: ClientOption[];
  selectedClient: string;
  selectedYear: number;
  selectedQuarters: string[];
  cumulativeMode: boolean;
  compareMode: boolean;
  onClientChange: (clientId: string) => void;
  onYearChange: (year: number) => void;
  onQuarterToggle: (quarter: string) => void;
  onCumulativeToggle: () => void;
  onCompareToggle: () => void;
  onRefresh: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// Helper: Organize clients hierarchically (parent → subsidiaries)
// ═══════════════════════════════════════════════════════════════════════
interface OrganizedClient extends ClientOption {
  isChild: boolean;
  childCount?: number;
}

function organizeClientsHierarchically(clients: ClientOption[]): OrganizedClient[] {
  if (!clients || clients.length === 0) return [];

  const parents = clients
    .filter(c => (c.client_type || "").toLowerCase() === "parent")
    .sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""));

  const subsidiaries = clients
    .filter(c => (c.client_type || "").toLowerCase() === "subsidiary");

  const others = clients.filter(c => {
    const t = (c.client_type || "").toLowerCase();
    return t !== "parent" && t !== "subsidiary";
  });

  const result: OrganizedClient[] = [];
  const usedIds = new Set<string>();

  parents.forEach(parent => {
    const pid = parent.client_id || "";

    // Find subsidiaries belonging to this parent
    const parentSubs = subsidiaries
      .filter(s => s.parent_client_id === pid)
      .sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""));

    result.push({ ...parent, isChild: false, childCount: parentSubs.length });
    usedIds.add(pid);

    parentSubs.forEach(sub => {
      usedIds.add(sub.client_id || "");
      result.push({ ...sub, isChild: true });
    });
  });

  // Add remaining (orphan subsidiaries or others)
  [...subsidiaries, ...others]
    .filter(c => !usedIds.has(c.client_id || ""))
    .sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""))
    .forEach(c => result.push({
      ...c,
      isChild: (c.client_type || "").toLowerCase() === "subsidiary",
    }));

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Helper: Get parent groups (parents that have subsidiaries)
// ═══════════════════════════════════════════════════════════════════════
interface ParentGroup {
  id: string;
  name: string;
  entityCount: number;
  totalMembers: number;
}

function getParentGroups(clients: ClientOption[]): ParentGroup[] {
  const parents = clients.filter(c => (c.client_type || "").toLowerCase() === "parent");
  const subsidiaries = clients.filter(c => (c.client_type || "").toLowerCase() === "subsidiary");

  const groups: ParentGroup[] = [];

  parents.forEach(p => {
    const pid = p.client_id || "";
    const subs = subsidiaries.filter(s => s.parent_client_id === pid);
    if (subs.length > 0) {
      const totalMembers = (p.total_members || 0) +
        subs.reduce((sum, s) => sum + (s.total_members || 0), 0);
      groups.push({
        id: pid,
        name: p.client_name || p.company_name || "",
        entityCount: subs.length + 1,
        totalMembers,
      });
    }
  });

  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export function QuarterSelector({
  clients,
  selectedClient,
  selectedYear,
  selectedQuarters,
  cumulativeMode,
  compareMode,
  onClientChange,
  onYearChange,
  onQuarterToggle,
  onCumulativeToggle,
  onCompareToggle,
  onRefresh,
}: QuarterSelectorProps) {

  // ── Memoized hierarchy data ──────────────────────────────────────────
  const organized = useMemo(() => organizeClientsHierarchically(clients), [clients]);
  const parentGroups = useMemo(() => getParentGroups(clients), [clients]);

  return (
    <div className="qs-container">
      {/* ── Row 1: Client selector + Refresh ──────────────────────────── */}
      <div className="qs-client-row">
        <span className="qs-label">🏢 Client:</span>
        <select
          className="qs-client-select"
          value={selectedClient}
          onChange={(e) => onClientChange(e.target.value)}
        >
          {/* All Clients */}
          <option value="ALL">🏢 All Clients (Company Total)</option>

          {/* ── GROUP options ────────────────────────────────────────── */}
          {parentGroups.length > 0 && (
            <optgroup label="🏢 Groups (Parent + Subsidiaries)">
              {parentGroups.map(g => (
                <option key={`GROUP:${g.id}`} value={`GROUP:${g.id}`}>
                  🏢 {g.name} ({g.entityCount} entities)
                </option>
              ))}
            </optgroup>
          )}

          {/* ── Individual clients with hierarchy ───────────────────── */}
          <optgroup label="👤 All Clients">
            {organized.map(c => (
              <option
                key={c.client_id}
                value={c.client_id}
              >
                {c.isChild ? "└ " : "🏢 "}{c.client_name || c.company_name || c.client_id}
              </option>
            ))}
          </optgroup>
        </select>

        <button className="qs-refresh-btn" onClick={onRefresh}>
          🔄 Refresh Data
        </button>
      </div>

      {/* ── Row 2: Quarter buttons + Year + Modes ─────────────────────── */}
      <div className="qs-quarter-row">
        <div className="qs-left">
          <span className="qs-label">📅 Select Period:</span>
          <div className="qs-buttons">
            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
              <button
                key={q}
                className={`qs-btn ${selectedQuarters.includes(q) ? "active" : ""}`}
                onClick={() => onQuarterToggle(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <select
            className="qs-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="qs-right">
          <button
            className={`qs-mode-btn ${cumulativeMode ? "active-green" : ""}`}
            onClick={onCumulativeToggle}
          >
            📊 {cumulativeMode ? "Cumulative" : "Single Period"}
          </button>
          <button
            className={`qs-mode-btn ${compareMode ? "active-gold" : ""}`}
            onClick={onCompareToggle}
          >
            ⚖️ Compare Quarters
          </button>
          <span className="qs-badge">
            {selectedQuarters.join(compareMode ? " vs " : " + ")} {selectedYear}
          </span>
        </div>
      </div>
    </div>
  );
}
