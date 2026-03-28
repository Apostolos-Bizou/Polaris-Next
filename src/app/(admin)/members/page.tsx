'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Types ────────────────────────────────────────────────────────────
interface ClientMember {
  client_id: string;
  client_name: string;
  client_type: string;
  parent_client_id: string | null;
  total_members: number;
  principals: number;
  dependents: number;
  plan: string;
  status: string;
}

interface MonthlyRecord {
  month: string;       // "Jan-25", "Feb-25", etc.
  members: number;
  change: number;
  pctChange: number;
}

interface EntityTimeline {
  client_id: string;
  client_name: string;
  parent_client_id: string | null;
  plan: string;
  monthly: MonthlyRecord[];
}

// ── Constants ────────────────────────────────────────────────────────
const MONTHS = [
  'Jun-24','Jul-24','Aug-24','Sep-24','Oct-24','Nov-24','Dec-24',
  'Jan-25','Feb-25','Mar-25','Apr-25','May-25','Jun-25',
  'Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26'
];
const MONTHS_SHORT = MONTHS.map(m => m.replace('-', '\n'));

const PARENT_NAMES: Record<string, string> = {
  'CLI-2026-0001': 'DIANA SHIPPING', 'CLI-2026-0005': 'CENTROFIN', 'CLI-2026-0015': 'ASTRA',
  'CLI-2026-0018': 'AIMS', 'CLI-2026-0020': 'ANOSIS', 'CLI-2026-0022': 'CROSSWORLD',
  'CLI-2026-0038': 'EFNAV', 'CLI-2026-0040': 'GOLDEN UNION', 'CLI-2026-0045': 'HEALTHPLUS',
  'CLI-2026-0047': 'OMICRON', 'CLI-2026-0049': 'KYKLADES', 'CLI-2026-0051': 'MINOA',
  'CLI-2026-0053': 'LEADER MARINE', 'CLI-2026-0061': 'IONIC',
};

const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  'Gold': { color: '#FFB300', bg: 'rgba(255,179,0,0.15)' },
  'Platinum': { color: '#9E9E9E', bg: 'rgba(158,158,158,0.15)' },
  'Silver': { color: '#78909C', bg: 'rgba(120,144,156,0.15)' },
};

const fmt = (n: number) => n.toLocaleString();

// ── Generate realistic monthly timeline data ─────────────────────────
function generateTimeline(baseName: string, baseMembers: number, startMonth: number): MonthlyRecord[] {
  const records: MonthlyRecord[] = [];
  let current = 0;
  for (let i = 0; i < MONTHS.length; i++) {
    if (i < startMonth) {
      records.push({ month: MONTHS[i], members: 0, change: 0, pctChange: 0 });
    } else if (i === startMonth) {
      current = Math.round(baseMembers * 0.7);
      records.push({ month: MONTHS[i], members: current, change: current, pctChange: 0 });
    } else {
      const variation = Math.round((Math.random() - 0.35) * baseMembers * 0.08);
      const prev = current;
      current = Math.max(1, current + variation);
      const pct = prev > 0 ? ((current - prev) / prev * 100) : 0;
      records.push({ month: MONTHS[i], members: current, change: current - prev, pctChange: parseFloat(pct.toFixed(1)) });
    }
  }
  // Ensure last month matches target
  if (records.length > 0) records[records.length - 1].members = baseMembers;
  return records;
}

// ── Member Data (Overview tab) ───────────────────────────────────────
const MEMBER_DATA: ClientMember[] = [
  { client_id: 'CLI-2026-0002', client_name: 'DIANA GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001', total_members: 486, principals: 204, dependents: 282, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0003', client_name: 'DIANA PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001', total_members: 312, principals: 131, dependents: 181, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0004', client_name: 'DIANA MARINERS INC', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001', total_members: 89, principals: 37, dependents: 52, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0006', client_name: 'CENTROFIN GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 654, principals: 275, dependents: 379, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0007', client_name: 'CENTROFIN PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 423, principals: 178, dependents: 245, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0008', client_name: 'CENTROFIN SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 287, principals: 121, dependents: 166, plan: 'Silver', status: 'active' },
  { client_id: 'CLI-2026-0009', client_name: 'CENTROFIN MARINE TRUST GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0010', client_name: 'CENTROFIN MARINE TRUST PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 156, principals: 66, dependents: 90, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0011', client_name: 'CENTROFIN MARINE TRUST SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 112, principals: 47, dependents: 65, plan: 'Silver', status: 'active' },
  { client_id: 'CLI-2026-0016', client_name: 'ASTRA SHIPMANAGEMENT GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015', total_members: 345, principals: 145, dependents: 200, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0017', client_name: 'ASTRA TANKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015', total_members: 189, principals: 79, dependents: 110, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0019', client_name: 'AIMS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0018', total_members: 234, principals: 98, dependents: 136, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0021', client_name: 'ANOSIS PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0020', total_members: 267, principals: 112, dependents: 155, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0023', client_name: 'CROSSWORLD STAF&FAM GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 534, principals: 224, dependents: 310, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0024', client_name: 'CROSSWORLD STAF&FAM PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 412, principals: 173, dependents: 239, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0025', client_name: 'BOURBON GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 289, principals: 121, dependents: 168, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0029', client_name: 'PIONEER CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 234, principals: 98, dependents: 136, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0039', client_name: 'EFNAV GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0038', total_members: 178, principals: 75, dependents: 103, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0041', client_name: 'GOLDEN UNION SHIPPING GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 345, principals: 145, dependents: 200, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0042', client_name: 'GOLDEN UNION SHIPPING PALTINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 267, principals: 112, dependents: 155, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0046', client_name: 'HEALTHPLUS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0045', total_members: 123, principals: 52, dependents: 71, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0048', client_name: 'OMICRON GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0047', total_members: 267, principals: 112, dependents: 155, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0050', client_name: 'KYKLADES PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0049', total_members: 312, principals: 131, dependents: 181, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0052', client_name: 'MINOA GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0051', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0054', client_name: 'LEADER AQUILA BULKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 134, principals: 56, dependents: 78, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0055', client_name: 'LEADER FALCON GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 112, principals: 47, dependents: 65, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0062', client_name: 'IONIC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0063', client_name: 'IONIC PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061', total_members: 156, principals: 66, dependents: 90, plan: 'Platinum', status: 'active' },
];

// ── Generate timeline data for each entity ───────────────────────────
const TIMELINE_DATA: EntityTimeline[] = MEMBER_DATA.map((m, i) => ({
  client_id: m.client_id,
  client_name: m.client_name,
  parent_client_id: m.parent_client_id,
  plan: m.plan,
  monthly: generateTimeline(m.client_name, m.total_members, Math.min(i % 4, 1)), // most start from month 0 or 1
}));

// Compute SYNOLO row (totals per month)
const SYNOLO_ROW: MonthlyRecord[] = MONTHS.map((month, mi) => {
  const total = TIMELINE_DATA.reduce((s, e) => s + e.monthly[mi].members, 0);
  const prevTotal = mi > 0 ? TIMELINE_DATA.reduce((s, e) => s + e.monthly[mi - 1].members, 0) : 0;
  const change = total - prevTotal;
  const pct = prevTotal > 0 ? parseFloat(((total - prevTotal) / prevTotal * 100).toFixed(1)) : 0;
  return { month, members: total, change, pctChange: pct };
});

// ═══════════════════════════════════════════════════════════════════════
export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracker'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterParent, setFilterParent] = useState('all');
  const [sortField, setSortField] = useState<'client_name' | 'total_members' | 'plan'>('total_members');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailEntity, setDetailEntity] = useState<EntityTimeline | null>(null);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerGroup, setTrackerGroup] = useState('all');

  // ── Overview stats ─────────────────────────────────────────────────
  const totalMembers = MEMBER_DATA.reduce((s, m) => s + m.total_members, 0);
  const totalPrincipals = MEMBER_DATA.reduce((s, m) => s + m.principals, 0);
  const totalDependents = MEMBER_DATA.reduce((s, m) => s + m.dependents, 0);

  const planBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    MEMBER_DATA.forEach(m => { map[m.plan] = (map[m.plan] || 0) + m.total_members; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const parentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    MEMBER_DATA.forEach(m => { map[PARENT_NAMES[m.parent_client_id || ''] || 'Other'] = (map[PARENT_NAMES[m.parent_client_id || ''] || 'Other'] || 0) + m.total_members; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, []);

  // ── Overview filter ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = MEMBER_DATA.slice();
    if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); list = list.filter(m => m.client_name.toLowerCase().includes(t)); }
    if (filterPlan !== 'all') list = list.filter(m => m.plan === filterPlan);
    if (filterParent !== 'all') list = list.filter(m => m.parent_client_id === filterParent);
    list.sort((a, b) => {
      const d = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total_members') return (a.total_members - b.total_members) * d;
      if (sortField === 'plan') return a.plan.localeCompare(b.plan) * d;
      return a.client_name.localeCompare(b.client_name) * d;
    });
    return list;
  }, [searchTerm, filterPlan, filterParent, sortField, sortDir]);

  const toggleSort = (f: typeof sortField) => { if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDir('desc'); } };

  // ── Tracker filter ─────────────────────────────────────────────────
  const filteredTimeline = useMemo(() => {
    let list = TIMELINE_DATA;
    if (trackerSearch.trim()) { const t = trackerSearch.toLowerCase(); list = list.filter(e => e.client_name.toLowerCase().includes(t)); }
    if (trackerGroup !== 'all') list = list.filter(e => e.parent_client_id === trackerGroup);
    return list;
  }, [trackerSearch, trackerGroup]);

  // ── Charts ─────────────────────────────────────────────────────────
  const prinDepData = { labels: ['Principals', 'Dependents'], datasets: [{ data: [totalPrincipals, totalDependents], backgroundColor: ['rgba(52,152,219,0.85)', 'rgba(155,89,182,0.85)'], borderColor: ['#2980b9', '#8e44ad'], borderWidth: 3, hoverOffset: 10 }] };
  const groupChartData = { labels: parentBreakdown.map(p => p[0]), datasets: [{ data: parentBreakdown.map(p => p[1]), backgroundColor: 'rgba(212,175,55,0.7)', borderColor: '#D4AF37', borderWidth: 1, borderRadius: 4 }] };

  return (
    <div className="members-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Members</h1>
          <p className="page-subtitle">Active members across all client organizations</p>
        </div>
        <div className="tab-switcher">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`} onClick={() => setActiveTab('tracker')}>📅 Member Tracker</button>
        </div>
      </div>

      {/* ═══════ TAB 1: OVERVIEW ═══════ */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card big"><div className="stat-icon">👥</div><div className="stat-value">{fmt(totalMembers)}</div><div className="stat-label">Total Members</div></div>
            <div className="stat-card"><div className="stat-icon">👤</div><div className="stat-value blue">{fmt(totalPrincipals)}</div><div className="stat-label">Principals</div><div className="stat-pct">{(totalPrincipals / totalMembers * 100).toFixed(1)}%</div></div>
            <div className="stat-card"><div className="stat-icon">👨‍👩‍👧</div><div className="stat-value purple">{fmt(totalDependents)}</div><div className="stat-label">Dependents</div><div className="stat-pct">{(totalDependents / totalMembers * 100).toFixed(1)}%</div></div>
            <div className="stat-card"><div className="stat-icon">🏢</div><div className="stat-value">{MEMBER_DATA.length}</div><div className="stat-label">Active Entities</div></div>
            {planBreakdown.map(([plan, count]) => (
              <div key={plan} className="stat-card" style={{ borderLeftColor: PLAN_COLORS[plan]?.color }}><div className="stat-value" style={{ color: PLAN_COLORS[plan]?.color }}>{fmt(count)}</div><div className="stat-label">{plan}</div></div>
            ))}
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3 className="chart-title">👤 Principal vs Dependent</h3>
              <div className="chart-container"><Doughnut data={prinDepData} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#7aa0c0', font: { size: 13, weight: 'bold' }, padding: 15 } }, tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', titleColor: '#D4AF37', bodyColor: '#fff' } } }} /></div>
            </div>
            <div className="chart-card">
              <h3 className="chart-title">🏢 Top Groups</h3>
              <div className="chart-container"><Bar data={groupChartData} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', titleColor: '#D4AF37', bodyColor: '#fff' } }, scales: { x: { grid: { color: 'rgba(45,80,112,0.2)' }, ticks: { color: '#7aa0c0' } }, y: { grid: { display: false }, ticks: { color: '#7aa0c0' } } } }} /></div>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />{searchTerm && <button onClick={() => setSearchTerm('')}>✕</button>}</div>
            <div className="filter-group">
              {['all', 'Gold', 'Platinum', 'Silver'].map(p => (<button key={p} className={`filter-btn ${filterPlan === p ? 'active' : ''}`} onClick={() => setFilterPlan(p)}>{p === 'all' ? 'All Plans' : p}</button>))}
            </div>
            <select className="parent-filter" value={filterParent} onChange={(e) => setFilterParent(e.target.value)}>
              <option value="all">All Groups</option>
              {Object.entries(PARENT_NAMES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
            </select>
          </div>

          <div className="table-container">
            <table className="members-table">
              <thead><tr>
                <th style={{ width: '40px' }}>#</th>
                <th className="sortable" onClick={() => toggleSort('client_name')}>Entity {sortField === 'client_name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th>Group</th>
                <th className="sortable" onClick={() => toggleSort('plan')}>Plan {sortField === 'plan' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="sortable" onClick={() => toggleSort('total_members')}>Total {sortField === 'total_members' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th>Principals</th><th>Dependents</th><th>Ratio</th>
              </tr></thead>
              <tbody>
                {filtered.map((m, i) => {
                  const pc = PLAN_COLORS[m.plan] || { color: '#999', bg: 'rgba(100,100,100,0.1)' };
                  const pct = m.total_members > 0 ? (m.principals / m.total_members * 100).toFixed(0) : '0';
                  return (
                    <tr key={m.client_id}>
                      <td className="row-num">{i + 1}</td>
                      <td className="name-cell"><div className="entity-name">{m.client_name}</div><div className="entity-id">{m.client_id}</div></td>
                      <td className="group-cell">{PARENT_NAMES[m.parent_client_id || ''] || '—'}</td>
                      <td><span className="plan-badge" style={{ color: pc.color, background: pc.bg }}>{m.plan}</span></td>
                      <td className="total-cell">{fmt(m.total_members)}</td>
                      <td className="prin-cell">{fmt(m.principals)}</td>
                      <td className="dep-cell">{fmt(m.dependents)}</td>
                      <td><div className="ratio-bar"><div className="ratio-fill prin" style={{ width: pct + '%' }}></div><div className="ratio-fill dep" style={{ width: (100 - parseInt(pct)) + '%' }}></div></div><div className="ratio-text">{pct}% P</div></td>
                    </tr>);
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB 2: MEMBER TRACKER (FULL SCREEN) ═══════ */}
      {activeTab === 'tracker' && (
        <div className="tracker-fullscreen">
          <div className="tracker-toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search entity..." value={trackerSearch} onChange={(e) => setTrackerSearch(e.target.value)} />{trackerSearch && <button onClick={() => setTrackerSearch('')}>✕</button>}</div>
            <select className="parent-filter" value={trackerGroup} onChange={(e) => setTrackerGroup(e.target.value)}>
              <option value="all">All Groups</option>
              {Object.entries(PARENT_NAMES).map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
            </select>
            <div className="tracker-legend">
              <span className="legend-up">● Increase</span>
              <span className="legend-down">● Decrease</span>
              <span className="legend-neutral">● No change</span>
            </div>
          </div>

          <div className="tracker-scroll">
            <table className="tracker-table">
              <thead>
                <tr>
                  <th className="sticky-num">#</th>
                  <th className="sticky-name">Εταιρεία</th>
                  {MONTHS.map(m => <th key={m} className="month-th">{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {/* SYNOLO Row - sticky */}
                <tr className="synolo-row">
                  <td className="sticky-num synolo-cell">Σ</td>
                  <td className="sticky-name synolo-cell synolo-name-cell">ΣΥΝΟΛΟ ✓</td>
                  {SYNOLO_ROW.map((r, i) => (
                    <td key={i} className="synolo-cell data-cell">
                      <div className="cell-val">{fmt(r.members)}</div>
                      {i > 0 && <div className={`cell-chg ${r.change > 0 ? 'up' : r.change < 0 ? 'down' : 'flat'}`}>{r.change > 0 ? '+' : ''}{fmt(r.change)} <span className="dot">●</span></div>}
                      {i > 0 && <div className={`cell-pct ${r.pctChange > 0 ? 'up' : r.pctChange < 0 ? 'down' : 'flat'}`}>{r.pctChange > 0 ? '+' : ''}{r.pctChange}%</div>}
                    </td>
                  ))}
                </tr>

                {/* Entity Rows */}
                {filteredTimeline.map((entity, idx) => (
                  <tr key={entity.client_id} className={`entity-row ${idx % 2 === 0 ? 'row-even' : 'row-odd'}`} onClick={() => setDetailEntity(entity)}>
                    <td className="sticky-num">{idx + 1}</td>
                    <td className="sticky-name entity-name-td">
                      <div className="ent-name">{entity.client_name}</div>
                      <div className="ent-group">{PARENT_NAMES[entity.parent_client_id || ''] || ''}</div>
                    </td>
                    {entity.monthly.map((r, i) => (
                      <td key={i} className={`data-cell ${r.members === 0 ? 'zero-cell' : ''}`}>
                        {r.members > 0 ? (
                          <>
                            <div className="cell-val">{fmt(r.members)}</div>
                            {i > 0 && <div className={`cell-chg ${r.change > 0 ? 'up' : r.change < 0 ? 'down' : 'flat'}`}>{r.change > 0 ? '+' : ''}{r.change} <span className="dot">●</span></div>}
                            {i > 0 && <div className={`cell-pct ${r.pctChange > 0 ? 'up' : r.pctChange < 0 ? 'down' : 'flat'}`}>{r.pctChange > 0 ? '+' : ''}{r.pctChange}%</div>}
                          </>
                        ) : <span className="cell-empty">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ DETAIL MODAL ═══════ */}
      {detailEntity && (
        <div className="detail-overlay" onClick={() => setDetailEntity(null)}>
          <div className="detail-box" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <h2 className="detail-title">{detailEntity.client_name}</h2>
                <p className="detail-sub">{PARENT_NAMES[detailEntity.parent_client_id || ''] || ''} • {detailEntity.plan} Plan</p>
              </div>
              <button className="detail-close" onClick={() => setDetailEntity(null)}>✕</button>
            </div>
            <div className="detail-body">
              <table className="detail-table">
                <thead><tr><th>Μήνας</th><th>Μέλη</th><th>Μεταβολή</th><th>Ποσοστό</th></tr></thead>
                <tbody>
                  {[...detailEntity.monthly].reverse().map((r, i) => (
                    r.members > 0 && (
                      <tr key={i}>
                        <td className="detail-month">{r.month}</td>
                        <td className="detail-members">{fmt(r.members)}</td>
                        <td>
                          <span className={`detail-change ${r.change > 0 ? 'up' : r.change < 0 ? 'down' : ''}`}>
                            {r.change > 0 ? '+' : ''}{r.change}
                            <span className={`dot ${r.change > 0 ? 'green' : r.change < 0 ? 'red' : 'yellow'}`}>●</span>
                          </span>
                        </td>
                        <td className={`detail-pct ${r.pctChange > 0 ? 'up' : r.pctChange < 0 ? 'down' : ''}`}>
                          {r.pctChange > 0 ? '+' : ''}{r.pctChange}%
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .members-page { max-width: 1500px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .page-subtitle { color: #7aa0c0; font-size: 0.9rem; }

        /* Tabs */
        .tab-switcher { display: flex; gap: 0.25rem; background: rgba(10,22,40,0.5); border-radius: 12px; padding: 0.25rem; }
        .tab-btn { background: transparent; border: none; color: #7aa0c0; padding: 0.6rem 1.25rem; border-radius: 10px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: #1e3a5f; color: #D4AF37; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }

        /* Overview Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .stat-card { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid rgba(45,80,112,0.25); border-radius: 14px; padding: 1rem; text-align: center; border-left: 4px solid rgba(45,80,112,0.3); }
        .stat-card.big { border-left-color: #D4AF37; }
        .stat-icon { font-size: 1.2rem; margin-bottom: 0.2rem; }
        .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .stat-value.blue { color: #3498db; } .stat-value.purple { color: #9b59b6; }
        .stat-label { font-size: 0.8rem; color: #7aa0c0; } .stat-pct { font-size: 0.7rem; color: #5a6a7a; }

        /* Charts */
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .chart-card { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; padding: 1.25rem; }
        .chart-title { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem; }
        .chart-container { height: 250px; position: relative; }

        /* Toolbar */
        .toolbar, .tracker-toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .search-box { flex: 1; min-width: 200px; display: flex; align-items: center; background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3); border-radius: 10px; padding: 0 0.75rem; }
        .search-box input { flex: 1; background: transparent; border: none; color: #fff; padding: 0.6rem 0.5rem; font-size: 0.9rem; outline: none; }
        .search-box input::placeholder { color: #5a6a7a; }
        .search-box button { background: none; border: none; color: #7aa0c0; cursor: pointer; }
        .filter-group { display: flex; gap: 0.25rem; }
        .filter-btn { background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.2); color: #7aa0c0; padding: 0.45rem 0.65rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-family: inherit; }
        .filter-btn.active { background: rgba(45,80,112,0.2); border-color: rgba(45,80,112,0.5); color: #fff; font-weight: 600; }
        .parent-filter { background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3); border-radius: 8px; color: #fff; padding: 0.45rem 0.65rem; font-size: 0.85rem; outline: none; font-family: inherit; }
        .parent-filter option { background: #0a1628; }

        /* Overview Table */
        .table-container { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; overflow: hidden; }
        .members-table { width: 100%; border-collapse: collapse; }
        .members-table th { font-family: 'Montserrat', sans-serif; font-size: 0.8rem; font-weight: 600; color: #D4AF37; text-align: left; padding: 0.85rem 0.75rem; border-bottom: 2px solid rgba(212,175,55,0.2); text-transform: uppercase; }
        .sortable { cursor: pointer; } .sortable:hover { color: #FFD700; }
        .members-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(45,80,112,0.1); font-size: 0.9rem; color: rgba(184,212,232,0.7); }
        .members-table tr:hover td { background: rgba(45,80,112,0.06); }
        .row-num { text-align: center; font-size: 0.8rem; color: #5a6a7a; font-weight: 600; }
        .name-cell { min-width: 200px; } .entity-name { color: #ffffff; font-weight: 600; } .entity-id { font-size: 0.7rem; color: #5a6a7a; font-family: monospace; }
        .group-cell { font-size: 0.85rem; color: #7aa0c0; }
        .plan-badge { padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
        .total-cell { font-weight: 700; color: #ffffff; font-size: 1rem; }
        .prin-cell { color: #3498db; font-weight: 600; } .dep-cell { color: #9b59b6; font-weight: 600; }
        .ratio-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.2rem; }
        .ratio-fill.prin { background: #3498db; } .ratio-fill.dep { background: #9b59b6; }
        .ratio-text { font-size: 0.7rem; color: #5a6a7a; }

        /* ═══ TRACKER TAB - FULL SCREEN ═══ */
        .tracker-fullscreen { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0a1628; z-index: 900; display: flex; flex-direction: column; }
        .tracker-toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; padding: 0.75rem 1.25rem; background: #0d1f2d; border-bottom: 2px solid rgba(212,175,55,0.3); flex-shrink: 0; }
        .tracker-legend { display: flex; gap: 1rem; font-size: 0.85rem; margin-left: auto; }
        .legend-up { color: #4CAF50; } .legend-down { color: #e74c3c; } .legend-neutral { color: #FF9800; }
        .tracker-scroll { flex: 1; overflow: auto; }

        .tracker-table { width: max-content; min-width: 100%; border-collapse: collapse; }

        /* Header */
        .tracker-table thead tr { position: sticky; top: 0; z-index: 20; }
        .tracker-table th { font-family: 'Montserrat', sans-serif; font-size: 0.85rem; font-weight: 700; padding: 0.85rem 0.75rem; text-align: center; white-space: nowrap; background: #1e3a5f; color: #ffffff; border-bottom: 3px solid #D4AF37; }
        .month-th { min-width: 120px; }

        /* Sticky columns */
        .sticky-num { position: sticky; left: 0; z-index: 15; width: 45px; text-align: center; background: inherit; }
        .sticky-name { position: sticky; left: 45px; z-index: 15; min-width: 220px; text-align: left !important; background: inherit; }

        /* Header sticky cols */
        .tracker-table thead .sticky-num, .tracker-table thead .sticky-name { z-index: 25; background: #1e3a5f; }

        /* Data cells */
        .data-cell { padding: 0.5rem 0.6rem; text-align: center; vertical-align: middle; min-width: 120px; border-right: 1px solid rgba(45,80,112,0.1); }
        .cell-val { font-size: 1.1rem; font-weight: 700; color: #ffffff; font-family: 'Montserrat', sans-serif; }
        .cell-chg { font-size: 0.85rem; margin-top: 0.15rem; font-weight: 600; }
        .cell-chg.up { color: #4CAF50; } .cell-chg.down { color: #e74c3c; } .cell-chg.flat { color: #607D8B; }
        .cell-pct { font-size: 0.8rem; margin-top: 0.1rem; font-weight: 500; }
        .cell-pct.up { color: #4CAF50; } .cell-pct.down { color: #e74c3c; } .cell-pct.flat { color: #607D8B; }
        .dot { font-size: 0.7rem; }
        .cell-empty { color: #2d3748; }
        .zero-cell { opacity: 0.3; }

        /* SYNOLO row - green background, sticky below header */
        .synolo-row { position: sticky; top: 44px; z-index: 18; }
        .synolo-cell { background: #2E7D32 !important; border-bottom: 3px solid #1B5E20; }
        .synolo-cell .cell-val { color: #ffffff; font-size: 1.25rem; }
        .synolo-cell .cell-chg { color: rgba(255,255,255,0.9); }
        .synolo-cell .cell-pct { color: rgba(255,255,255,0.8); }
        .synolo-name-cell { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.1rem; color: #ffffff; }
        .synolo-row .sticky-num { background: #2E7D32 !important; color: #ffffff; font-size: 1.1rem; font-weight: 700; }
        .synolo-row .sticky-name { background: #2E7D32 !important; }

        /* Entity rows - alternating colors */
        .entity-row { cursor: pointer; transition: background 0.15s; }
        .row-even td { background: #0a1628; }
        .row-odd td { background: #0d1f2d; }
        .row-even .sticky-num, .row-even .sticky-name { background: #0a1628; }
        .row-odd .sticky-num, .row-odd .sticky-name { background: #0d1f2d; }
        .entity-row:hover td { background: rgba(45,80,112,0.15) !important; }
        .entity-row:hover .sticky-num, .entity-row:hover .sticky-name { background: rgba(45,80,112,0.15) !important; }

        .entity-row td { padding: 0.6rem 0.5rem; border-bottom: 1px solid rgba(45,80,112,0.12); font-size: 0.9rem; }
        .entity-name-td { text-align: left !important; padding-left: 0.75rem !important; }
        .ent-name { color: #ffffff; font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
        .ent-group { font-size: 0.7rem; color: #5a6a7a; }
        .entity-row .row-num { text-align: center; font-weight: 600; color: #7aa0c0; }

        /* ═══ DETAIL MODAL ═══ */
        .detail-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .detail-box { background: linear-gradient(145deg, #0d1f2d, #0a1628); border: 1px solid rgba(45,80,112,0.4); border-radius: 20px; width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto; }
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.5rem; border-bottom: 2px solid rgba(212,175,55,0.3); }
        .detail-title { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; font-weight: 700; color: #D4AF37; }
        .detail-sub { color: #7aa0c0; font-size: 0.9rem; margin-top: 0.2rem; }
        .detail-close { background: none; border: none; color: #7aa0c0; font-size: 1.5rem; cursor: pointer; }
        .detail-body { padding: 1rem 1.5rem 1.5rem; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table th { font-size: 0.85rem; color: #7aa0c0; text-align: left; padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(45,80,112,0.3); font-weight: 600; }
        .detail-table td { padding: 0.65rem 0.5rem; border-bottom: 1px solid rgba(45,80,112,0.1); }
        .detail-month { font-weight: 600; color: #ffffff; }
        .detail-members { font-weight: 700; color: #ffffff; font-size: 1.05rem; }
        .detail-change { display: flex; align-items: center; gap: 0.4rem; }
        .detail-change.up { color: #4CAF50; } .detail-change.down { color: #e74c3c; }
        .dot { font-size: 0.9rem; } .dot.green { color: #4CAF50; } .dot.red { color: #e74c3c; } .dot.yellow { color: #FF9800; }
        .detail-pct { font-weight: 600; } .detail-pct.up { color: #4CAF50; } .detail-pct.down { color: #e74c3c; }

        @media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .page-header { flex-direction: column; } .toolbar, .tracker-toolbar { flex-direction: column; } .search-box { min-width: 100%; } }
      `}</style>
    </div>
  );
}
