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

// ── Dummy data from real CLIENTS_DATA + estimated member counts ──────
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
  { client_id: 'CLI-2026-0012', client_name: 'CENTROFIN TRUST BULKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 145, principals: 61, dependents: 84, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0013', client_name: 'CENTROFIN TRUST BULKERS PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 98, principals: 41, dependents: 57, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0014', client_name: 'CENTROFIN TRUST BULKERS SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005', total_members: 76, principals: 32, dependents: 44, plan: 'Silver', status: 'active' },
  { client_id: 'CLI-2026-0016', client_name: 'ASTRA SHIPMANAGEMENT GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015', total_members: 345, principals: 145, dependents: 200, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0017', client_name: 'ASTRA TANKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015', total_members: 189, principals: 79, dependents: 110, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0019', client_name: 'AIMS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0018', total_members: 234, principals: 98, dependents: 136, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0021', client_name: 'ANOSIS PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0020', total_members: 267, principals: 112, dependents: 155, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0023', client_name: 'CROSSWORLD STAF&FAM GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 534, principals: 224, dependents: 310, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0024', client_name: 'CROSSWORLD STAF&FAM PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 412, principals: 173, dependents: 239, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0025', client_name: 'BOURBON GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 289, principals: 121, dependents: 168, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0026', client_name: 'BOURBON PLATINUN CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 198, principals: 83, dependents: 115, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0027', client_name: 'CASSIOPEIA GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 176, principals: 74, dependents: 102, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0028', client_name: 'CASSIOPEIA PLATINUM CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 145, principals: 61, dependents: 84, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0029', client_name: 'PIONEER CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 234, principals: 98, dependents: 136, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0030', client_name: 'VERITAS GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 167, principals: 70, dependents: 97, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0031', client_name: 'VARSHIP GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 123, principals: 52, dependents: 71, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0032', client_name: 'POLARIS GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0033', client_name: 'POLARIS PLATINUM CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022', total_members: 134, principals: 56, dependents: 78, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0039', client_name: 'EFNAV GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0038', total_members: 178, principals: 75, dependents: 103, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0041', client_name: 'GOLDEN UNION SHIPPING GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 345, principals: 145, dependents: 200, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0042', client_name: 'GOLDEN UNION SHIPPING PALTINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 267, principals: 112, dependents: 155, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0043', client_name: 'GOLDEN UNION WORLD MANAGEMENT GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 189, principals: 79, dependents: 110, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0044', client_name: 'GOLDEN UNION ENTERPRISES GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040', total_members: 156, principals: 66, dependents: 90, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0046', client_name: 'HEALTHPLUS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0045', total_members: 123, principals: 52, dependents: 71, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0048', client_name: 'OMICRON GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0047', total_members: 267, principals: 112, dependents: 155, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0050', client_name: 'KYKLADES PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0049', total_members: 312, principals: 131, dependents: 181, plan: 'Platinum', status: 'active' },
  { client_id: 'CLI-2026-0052', client_name: 'MINOA GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0051', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0054', client_name: 'LEADER MARINE AQUILA BULKERS INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 134, principals: 56, dependents: 78, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0055', client_name: 'LEADER MARINE FALCON SHIPHOLDING INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 112, principals: 47, dependents: 65, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0056', client_name: 'LEADER MARINE IONIAN UNITED SHIPHOLDING INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 98, principals: 41, dependents: 57, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0057', client_name: 'LEADER MARINE LEADER BULKERS INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 145, principals: 61, dependents: 84, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0058', client_name: 'LEADER MARINE MOONSHINE BULKERS INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053', total_members: 89, principals: 37, dependents: 52, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0062', client_name: 'IONIC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061', total_members: 198, principals: 83, dependents: 115, plan: 'Gold', status: 'active' },
  { client_id: 'CLI-2026-0063', client_name: 'IONIC PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061', total_members: 156, principals: 66, dependents: 90, plan: 'Platinum', status: 'active' },
];

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
  'Diamond': { color: '#00BCD4', bg: 'rgba(0,188,212,0.15)' },
};

const fmt = (n: number) => n.toLocaleString();

// ═══════════════════════════════════════════════════════════════════════
export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterParent, setFilterParent] = useState('all');
  const [sortField, setSortField] = useState<'client_name' | 'total_members' | 'plan'>('total_members');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // ── Stats ──────────────────────────────────────────────────────────
  const totalMembers = MEMBER_DATA.reduce((s, m) => s + m.total_members, 0);
  const totalPrincipals = MEMBER_DATA.reduce((s, m) => s + m.principals, 0);
  const totalDependents = MEMBER_DATA.reduce((s, m) => s + m.dependents, 0);
  const activeEntities = MEMBER_DATA.length;

  // Plan breakdown
  const planBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    MEMBER_DATA.forEach(m => { map[m.plan] = (map[m.plan] || 0) + m.total_members; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  // Parent group breakdown (top 10)
  const parentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    MEMBER_DATA.forEach(m => {
      const parentName = PARENT_NAMES[m.parent_client_id || ''] || 'Other';
      map[parentName] = (map[parentName] || 0) + m.total_members;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, []);

  // ── Filter & Sort ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = MEMBER_DATA;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => m.client_name.toLowerCase().includes(term) || m.client_id.toLowerCase().includes(term));
    }
    if (filterPlan !== 'all') list = list.filter(m => m.plan === filterPlan);
    if (filterParent !== 'all') list = list.filter(m => m.parent_client_id === filterParent);

    list = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total_members') return (a.total_members - b.total_members) * dir;
      if (sortField === 'plan') return a.plan.localeCompare(b.plan) * dir;
      return a.client_name.localeCompare(b.client_name) * dir;
    });
    return list;
  }, [searchTerm, filterPlan, filterParent, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // ── Chart: Principal vs Dependent ─────────────────────────────────
  const prinDepData = {
    labels: ['Principals', 'Dependents'],
    datasets: [{ data: [totalPrincipals, totalDependents], backgroundColor: ['rgba(52,152,219,0.85)', 'rgba(155,89,182,0.85)'], borderColor: ['#2980b9', '#8e44ad'], borderWidth: 3, hoverOffset: 10 }],
  };

  // ── Chart: By Plan ─────────────────────────────────────────────────
  const planChartData = {
    labels: planBreakdown.map(p => p[0]),
    datasets: [{ data: planBreakdown.map(p => p[1]), backgroundColor: planBreakdown.map(p => PLAN_COLORS[p[0]]?.bg || 'rgba(100,100,100,0.3)'), borderColor: planBreakdown.map(p => PLAN_COLORS[p[0]]?.color || '#666'), borderWidth: 2, borderRadius: 6 }],
  };

  // ── Chart: Top Groups ──────────────────────────────────────────────
  const groupChartData = {
    labels: parentBreakdown.map(p => p[0]),
    datasets: [{ data: parentBreakdown.map(p => p[1]), backgroundColor: 'rgba(212,175,55,0.7)', borderColor: '#D4AF37', borderWidth: 1, borderRadius: 4 }],
  };

  const darkOpts = (horizontal = false) => ({
    responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', titleColor: '#D4AF37', bodyColor: '#fff' } },
    scales: {
      x: { grid: { color: 'rgba(45,80,112,0.2)' }, ticks: { color: '#7aa0c0' } },
      y: { grid: { display: false }, ticks: { color: '#7aa0c0' } },
    },
  });

  return (
    <div className="members-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Members Overview</h1>
          <p className="page-subtitle">Active members across all client organizations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card big">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{fmt(totalMembers)}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-value blue">{fmt(totalPrincipals)}</div>
          <div className="stat-label">Principals</div>
          <div className="stat-pct">{(totalPrincipals / totalMembers * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍👩‍👧</div>
          <div className="stat-value purple">{fmt(totalDependents)}</div>
          <div className="stat-label">Dependents</div>
          <div className="stat-pct">{(totalDependents / totalMembers * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{activeEntities}</div>
          <div className="stat-label">Active Entities</div>
        </div>
        {planBreakdown.map(([plan, count]) => (
          <div key={plan} className="stat-card" style={{ borderLeftColor: PLAN_COLORS[plan]?.color }}>
            <div className="stat-value" style={{ color: PLAN_COLORS[plan]?.color }}>{fmt(count)}</div>
            <div className="stat-label">{plan} Members</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3 className="chart-title">👤 Principal vs Dependent</h3>
          <div className="chart-container"><Doughnut data={prinDepData} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#7aa0c0', font: { size: 13, weight: 'bold' }, padding: 15 } }, tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', titleColor: '#D4AF37', bodyColor: '#fff' } } }} /></div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">📊 Members by Plan</h3>
          <div className="chart-container"><Bar data={planChartData} options={darkOpts()} /></div>
        </div>
        <div className="chart-card wide">
          <h3 className="chart-title">🏢 Top Groups by Members</h3>
          <div className="chart-container"><Bar data={groupChartData} options={darkOpts(true)} /></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && <button onClick={() => setSearchTerm('')}>✕</button>}
        </div>
        <div className="filter-group">
          {['all', 'Gold', 'Platinum', 'Silver'].map(p => (
            <button key={p} className={`filter-btn ${filterPlan === p ? 'active' : ''}`}
              onClick={() => setFilterPlan(p)}
              style={p !== 'all' && filterPlan === p ? { borderColor: PLAN_COLORS[p]?.color, color: PLAN_COLORS[p]?.color } : undefined}>
              {p === 'all' ? 'All Plans' : p}
            </button>
          ))}
        </div>
        <select className="parent-filter" value={filterParent} onChange={(e) => setFilterParent(e.target.value)}>
          <option value="all">All Groups</option>
          {Object.entries(PARENT_NAMES).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <div className="results-count">Showing {filtered.length} of {MEMBER_DATA.length} entities • {fmt(filtered.reduce((s, m) => s + m.total_members, 0))} members</div>

      {/* Table */}
      <div className="table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th className="sortable" onClick={() => toggleSort('client_name')}>Entity Name {sortField === 'client_name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Group</th>
              <th className="sortable" onClick={() => toggleSort('plan')}>Plan {sortField === 'plan' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th className="sortable" onClick={() => toggleSort('total_members')}>Total {sortField === 'total_members' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>Principals</th>
              <th>Dependents</th>
              <th>Ratio</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const planStyle = PLAN_COLORS[m.plan] || { color: '#999', bg: 'rgba(100,100,100,0.1)' };
              const pct = m.total_members > 0 ? (m.principals / m.total_members * 100).toFixed(0) : '0';
              return (
                <tr key={m.client_id}>
                  <td className="row-num">{i + 1}</td>
                  <td className="name-cell">
                    <div className="entity-name">{m.client_name}</div>
                    <div className="entity-id">{m.client_id}</div>
                  </td>
                  <td className="group-cell">{PARENT_NAMES[m.parent_client_id || ''] || '—'}</td>
                  <td><span className="plan-badge" style={{ color: planStyle.color, background: planStyle.bg }}>{m.plan}</span></td>
                  <td className="total-cell">{fmt(m.total_members)}</td>
                  <td className="prin-cell">{fmt(m.principals)}</td>
                  <td className="dep-cell">{fmt(m.dependents)}</td>
                  <td>
                    <div className="ratio-bar">
                      <div className="ratio-fill prin" style={{ width: pct + '%' }}></div>
                      <div className="ratio-fill dep" style={{ width: (100 - parseInt(pct)) + '%' }}></div>
                    </div>
                    <div className="ratio-text">{pct}% P</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .members-page { max-width: 1400px; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .page-subtitle { color: #7aa0c0; font-size: 0.9rem; margin-top: 0.25rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
        .stat-card {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid rgba(45,80,112,0.25); border-radius: 14px; padding: 1rem;
          text-align: center; border-left: 4px solid rgba(45,80,112,0.3);
        }
        .stat-card.big { border-left-color: #D4AF37; }
        .stat-icon { font-size: 1.3rem; margin-bottom: 0.3rem; }
        .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 700; color: #ffffff; }
        .stat-value.blue { color: #3498db; }
        .stat-value.purple { color: #9b59b6; }
        .stat-label { font-size: 0.8rem; color: #7aa0c0; }
        .stat-pct { font-size: 0.75rem; color: #5a6a7a; margin-top: 0.15rem; }

        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .chart-card {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; padding: 1.25rem;
        }
        .chart-card.wide { grid-column: 1 / -1; }
        .chart-title { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem; }
        .chart-container { height: 250px; position: relative; }
        .chart-card.wide .chart-container { height: 280px; }

        .toolbar { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .search-box {
          flex: 1; min-width: 220px; display: flex; align-items: center;
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3);
          border-radius: 10px; overflow: hidden; padding: 0 0.75rem;
        }
        .search-box input { flex: 1; background: transparent; border: none; color: #fff; padding: 0.65rem 0.5rem; font-size: 0.9rem; outline: none; }
        .search-box input::placeholder { color: #5a6a7a; }
        .search-box button { background: none; border: none; color: #7aa0c0; cursor: pointer; }
        .filter-group { display: flex; gap: 0.25rem; }
        .filter-btn {
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.2);
          color: #7aa0c0; padding: 0.45rem 0.65rem; border-radius: 8px;
          font-size: 0.85rem; cursor: pointer; font-family: inherit;
        }
        .filter-btn.active { background: rgba(45,80,112,0.2); border-color: rgba(45,80,112,0.5); color: #fff; font-weight: 600; }
        .parent-filter {
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3);
          border-radius: 8px; color: #fff; padding: 0.45rem 0.65rem; font-size: 0.85rem;
          outline: none; font-family: inherit;
        }
        .parent-filter option { background: #0a1628; }
        .results-count { color: #5a6a7a; font-size: 0.85rem; margin-bottom: 0.5rem; }

        .table-container {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; overflow: hidden;
        }
        .members-table { width: 100%; border-collapse: collapse; }
        .members-table th {
          font-family: 'Montserrat', sans-serif; font-size: 0.8rem; font-weight: 600;
          color: #D4AF37; text-align: left; padding: 0.85rem 0.75rem;
          border-bottom: 2px solid rgba(212,175,55,0.2); text-transform: uppercase; letter-spacing: 0.5px;
        }
        .sortable { cursor: pointer; }
        .sortable:hover { color: #FFD700; }
        .members-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid rgba(45,80,112,0.1); font-size: 0.9rem; color: rgba(184,212,232,0.7); }
        .members-table tr:hover td { background: rgba(45,80,112,0.06); }
        .row-num { text-align: center; font-size: 0.8rem; color: #5a6a7a; font-weight: 600; }
        .name-cell { min-width: 220px; }
        .entity-name { color: #ffffff; font-weight: 600; }
        .entity-id { font-size: 0.7rem; color: #5a6a7a; font-family: monospace; }
        .group-cell { font-size: 0.85rem; color: #7aa0c0; }
        .plan-badge { padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
        .total-cell { font-weight: 700; color: #ffffff; font-size: 1rem; }
        .prin-cell { color: #3498db; font-weight: 600; }
        .dep-cell { color: #9b59b6; font-weight: 600; }
        .ratio-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.2rem; }
        .ratio-fill.prin { background: #3498db; }
        .ratio-fill.dep { background: #9b59b6; }
        .ratio-text { font-size: 0.7rem; color: #5a6a7a; }

        @media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .toolbar { flex-direction: column; } .search-box { min-width: 100%; } }
      `}</style>
    </div>
  );
}
