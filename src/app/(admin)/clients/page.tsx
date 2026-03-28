'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────
interface Client {
  client_id: string;
  parent_client_id: string | null;
  client_type: string; // 'parent' | 'subsidiary'
  client_name: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  total_members?: number;
  members?: number;
  member_count?: number;
  status?: string;
  country?: string;
  created_date?: string;
}

// ── Dummy Data (matches real CLIENTS_DATA structure) ──────────────────
const DUMMY_CLIENTS: Client[] = [
  { client_id: 'CLI-2026-0001', parent_client_id: null, client_type: 'parent', client_name: 'DIANA SHIPPING SERVICES SA', total_members: 342, status: 'active', country: 'Greece', contact_name: 'John Papadopoulos', contact_email: 'jp@diana.gr' },
  { client_id: 'CLI-2026-0002', parent_client_id: 'CLI-2026-0001', client_type: 'subsidiary', client_name: 'DIANA GOLD', total_members: 180, status: 'active' },
  { client_id: 'CLI-2026-0003', parent_client_id: 'CLI-2026-0001', client_type: 'subsidiary', client_name: 'DIANA PLATINUM', total_members: 120, status: 'active' },
  { client_id: 'CLI-2026-0004', parent_client_id: 'CLI-2026-0001', client_type: 'subsidiary', client_name: 'DIANA MARINERS INC', total_members: 42, status: 'active' },
  { client_id: 'CLI-2026-0005', parent_client_id: null, client_type: 'parent', client_name: 'CENTROFIN', total_members: 856, status: 'active', country: 'Greece', contact_name: 'Maria Konstantinou', contact_email: 'mk@centrofin.gr' },
  { client_id: 'CLI-2026-0006', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN GOLD', total_members: 290, status: 'active' },
  { client_id: 'CLI-2026-0007', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN PLATINUM', total_members: 210, status: 'active' },
  { client_id: 'CLI-2026-0008', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN SILVER', total_members: 156, status: 'active' },
  { client_id: 'CLI-2026-0009', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN MARINE TRUST GOLD', total_members: 88, status: 'active' },
  { client_id: 'CLI-2026-0010', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN MARINE TRUST PLATINUM', total_members: 67, status: 'active' },
  { client_id: 'CLI-2026-0011', parent_client_id: 'CLI-2026-0005', client_type: 'subsidiary', client_name: 'CENTROFIN MARINE TRUST SILVER', total_members: 45, status: 'active' },
  { client_id: 'CLI-2026-0015', parent_client_id: null, client_type: 'parent', client_name: 'ASTRA SHIPMANAGEMENT INC', total_members: 234, status: 'active', country: 'Greece', contact_name: 'Nikos Andreou', contact_email: 'na@astra.gr' },
  { client_id: 'CLI-2026-0016', parent_client_id: 'CLI-2026-0015', client_type: 'subsidiary', client_name: 'ASTRA SHIPMANAGEMENT GOLD', total_members: 145, status: 'active' },
  { client_id: 'CLI-2026-0017', parent_client_id: 'CLI-2026-0015', client_type: 'subsidiary', client_name: 'ASTRA TANKERS GOLD', total_members: 89, status: 'active' },
  { client_id: 'CLI-2026-0022', parent_client_id: null, client_type: 'parent', client_name: 'CROSSWORLD MARINE SERVICES INC', total_members: 1245, status: 'active', country: 'Philippines', contact_name: 'Carlos Santos', contact_email: 'cs@crossworld.ph' },
  { client_id: 'CLI-2026-0023', parent_client_id: 'CLI-2026-0022', client_type: 'subsidiary', client_name: 'CROSSWORLD STAF&FAM GOLD', total_members: 320, status: 'active' },
  { client_id: 'CLI-2026-0024', parent_client_id: 'CLI-2026-0022', client_type: 'subsidiary', client_name: 'CROSSWORLD STAF&FAM PLATINUM', total_members: 280, status: 'active' },
  { client_id: 'CLI-2026-0025', parent_client_id: 'CLI-2026-0022', client_type: 'subsidiary', client_name: 'BOURBON GOLD CW', total_members: 195, status: 'active' },
  { client_id: 'CLI-2026-0026', parent_client_id: 'CLI-2026-0022', client_type: 'subsidiary', client_name: 'BOURBON PLATINUM CW', total_members: 150, status: 'active' },
  { client_id: 'CLI-2026-0040', parent_client_id: null, client_type: 'parent', client_name: 'GOLDEN UNION SHIPPING CO SA', total_members: 567, status: 'active', country: 'Greece', contact_name: 'Eleni Georgiou', contact_email: 'eg@goldenunion.gr' },
  { client_id: 'CLI-2026-0041', parent_client_id: 'CLI-2026-0040', client_type: 'subsidiary', client_name: 'GOLDEN UNION SHIPPING GOLD', total_members: 234, status: 'active' },
  { client_id: 'CLI-2026-0042', parent_client_id: 'CLI-2026-0040', client_type: 'subsidiary', client_name: 'GOLDEN UNION SHIPPING PLATINUM', total_members: 178, status: 'active' },
  { client_id: 'CLI-2026-0047', parent_client_id: null, client_type: 'parent', client_name: 'OMICRON SHIP MANAGEMENT INC', total_members: 198, status: 'active', country: 'Greece', contact_name: 'Dimitris Papas', contact_email: 'dp@omicron.gr' },
  { client_id: 'CLI-2026-0048', parent_client_id: 'CLI-2026-0047', client_type: 'subsidiary', client_name: 'OMICRON GOLD', total_members: 198, status: 'active' },
  { client_id: 'CLI-2026-0049', parent_client_id: null, client_type: 'parent', client_name: 'KYKLADES MARITIME CORPORATION', total_members: 156, status: 'active', country: 'Greece', contact_name: 'Stavros Nikos', contact_email: 'sn@kyklades.gr' },
  { client_id: 'CLI-2026-0050', parent_client_id: 'CLI-2026-0049', client_type: 'subsidiary', client_name: 'KYKLADES PLATINUM', total_members: 156, status: 'active' },
  { client_id: 'CLI-2026-0053', parent_client_id: null, client_type: 'parent', client_name: 'LEADER MARINE', total_members: 478, status: 'active', country: 'Greece', contact_name: 'Alexandros Metaxas', contact_email: 'am@leader.gr' },
  { client_id: 'CLI-2026-0054', parent_client_id: 'CLI-2026-0053', client_type: 'subsidiary', client_name: 'LEADER MARINE AQUILA BULKERS INC GOLD', total_members: 95, status: 'active' },
  { client_id: 'CLI-2026-0055', parent_client_id: 'CLI-2026-0053', client_type: 'subsidiary', client_name: 'LEADER MARINE FALCON SHIPHOLDING INC GOLD', total_members: 87, status: 'active' },
];

// ── Helper: Organize clients hierarchically ──────────────────────────
function organizeHierarchically(clients: Client[]) {
  const parents = clients
    .filter(c => (c.client_type || '').toLowerCase() === 'parent')
    .sort((a, b) => a.client_name.localeCompare(b.client_name));
  const subsidiaries = clients.filter(c => (c.client_type || '').toLowerCase() === 'subsidiary');
  const others = clients.filter(c => {
    const t = (c.client_type || '').toLowerCase();
    return t !== 'parent' && t !== 'subsidiary';
  });

  const result: (Client & { isChild: boolean; childCount?: number })[] = [];
  const usedIds = new Set<string>();

  parents.forEach(parent => {
    const pid = parent.client_id;
    const subs = subsidiaries
      .filter(s => s.parent_client_id === pid)
      .sort((a, b) => a.client_name.localeCompare(b.client_name));
    result.push({ ...parent, isChild: false, childCount: subs.length });
    usedIds.add(pid);
    subs.forEach(sub => {
      usedIds.add(sub.client_id);
      result.push({ ...sub, isChild: true });
    });
  });

  // Remaining clients
  [...subsidiaries, ...others]
    .filter(c => !usedIds.has(c.client_id))
    .sort((a, b) => a.client_name.localeCompare(b.client_name))
    .forEach(c => result.push({ ...c, isChild: (c.client_type || '').toLowerCase() === 'subsidiary' }));

  return result;
}

// ── Get member count helper ──────────────────────────────────────────
function getMembers(c: Client): number {
  return c.total_members || c.members || c.member_count || 0;
}

// ── Get total members for a parent (sum of subsidiaries) ─────────────
function getParentTotalMembers(parentId: string, allClients: Client[]): number {
  const subs = allClients.filter(c => c.parent_client_id === parentId);
  if (subs.length === 0) return 0;
  return subs.reduce((sum, c) => sum + getMembers(c), 0);
}

// ── Plan badge from name ─────────────────────────────────────────────
function getPlanBadge(name: string): { plan: string; color: string; bg: string } | null {
  const upper = name.toUpperCase();
  if (upper.includes('GOLD')) return { plan: 'GOLD', color: '#FF8F00', bg: 'rgba(255,193,7,0.15)' };
  if (upper.includes('PLAT')) return { plan: 'PLATINUM', color: '#9E9E9E', bg: 'rgba(189,189,189,0.15)' };
  if (upper.includes('SILVER')) return { plan: 'SILVER', color: '#757575', bg: 'rgba(158,158,158,0.15)' };
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(DUMMY_CLIENTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'parent' | 'subsidiary'>('all');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');

  // In production, load from API:
  // useEffect(() => {
  //   async function loadClients() {
  //     setLoading(true);
  //     try {
  //       const res = await fetch('/api/proxy/getClients');
  //       const data = await res.json();
  //       if (data.success) setClients(data.data || data);
  //     } catch (err) { console.error(err); }
  //     setLoading(false);
  //   }
  //   loadClients();
  // }, []);

  // ── Stats ────────────────────────────────────────────────────────────
  const parentCount = clients.filter(c => c.client_type === 'parent').length;
  const subCount = clients.filter(c => c.client_type === 'subsidiary').length;
  const totalMembers = clients.reduce((sum, c) => sum + getMembers(c), 0);
  // Only count parent members (to avoid double counting with subsidiaries)
  const parentMembers = clients
    .filter(c => c.client_type === 'parent')
    .reduce((sum, c) => sum + getParentTotalMembers(c.client_id, clients), 0);

  // ── Filter & Search ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = clients;

    // Type filter
    if (filterType !== 'all') {
      list = list.filter(c => c.client_type === filterType);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.client_name.toLowerCase().includes(term) ||
        (c.client_id || '').toLowerCase().includes(term) ||
        (c.contact_name || '').toLowerCase().includes(term) ||
        (c.contact_email || '').toLowerCase().includes(term)
      );
    }

    return list;
  }, [clients, filterType, searchTerm]);

  // ── Organize for display ─────────────────────────────────────────────
  const organized = useMemo(() => {
    if (viewMode === 'flat') {
      return filtered
        .sort((a, b) => a.client_name.localeCompare(b.client_name))
        .map(c => ({ ...c, isChild: false }));
    }
    return organizeHierarchically(filtered);
  }, [filtered, viewMode]);

  // ── Toggle parent expand ─────────────────────────────────────────────
  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  // ── Expand/Collapse all ──────────────────────────────────────────────
  const expandAll = () => {
    const allParentIds = clients.filter(c => c.client_type === 'parent').map(c => c.client_id);
    setExpandedParents(new Set(allParentIds));
  };
  const collapseAll = () => setExpandedParents(new Set());

  // ── Should show row (check if parent expanded) ───────────────────────
  const shouldShowRow = (client: Client & { isChild: boolean }) => {
    if (!client.isChild) return true;
    if (viewMode === 'flat') return true;
    return expandedParents.has(client.parent_client_id || '');
  };

  return (
    <div className="clients-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📁 Client Management</h1>
          <p className="page-subtitle">Manage your client portfolio and subsidiaries</p>
        </div>
        <button className="add-btn" onClick={() => alert('Add Client modal - coming soon')}>
          + Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{parentCount}</div>
          <div className="stat-label">Parent Companies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value">{subCount}</div>
          <div className="stat-label">Subsidiaries</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-label">Total Entities</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{parentMembers.toLocaleString()}</div>
          <div className="stat-label">Total Members</div>
        </div>
      </div>

      {/* Toolbar: Search + Filters + View Mode */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search clients by name, ID, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="filter-group">
          {(['all', 'parent', 'subsidiary'] as const).map(type => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All' : type === 'parent' ? '🏢 Parents' : '🏷️ Subsidiaries'}
            </button>
          ))}
        </div>
        <div className="view-group">
          <button
            className={`view-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
            onClick={() => setViewMode('hierarchy')}
            title="Hierarchical view"
          >
            🗂️
          </button>
          <button
            className={`view-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
            title="Flat list view"
          >
            📋
          </button>
          {viewMode === 'hierarchy' && (
            <>
              <button className="expand-btn" onClick={expandAll}>Expand All</button>
              <button className="expand-btn" onClick={collapseAll}>Collapse All</button>
            </>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Showing {organized.filter(c => shouldShowRow(c)).length} of {clients.length} clients
        {searchTerm && <span className="search-tag">matching &quot;{searchTerm}&quot;</span>}
      </div>

      {/* Client Table */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="client-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Client Name</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Members</th>
                <th>Contact</th>
                <th>Status</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organized.filter(c => shouldShowRow(c)).map(client => {
                const isParent = client.client_type === 'parent' && viewMode === 'hierarchy';
                const isExpanded = expandedParents.has(client.client_id);
                const childCount = (client as any).childCount || 0;
                const planBadge = getPlanBadge(client.client_name);
                const members = getMembers(client);
                const parentTotal = isParent ? getParentTotalMembers(client.client_id, clients) : 0;

                return (
                  <tr
                    key={client.client_id}
                    className={`client-row ${client.isChild ? 'child-row' : ''} ${isParent ? 'parent-row' : ''}`}
                  >
                    {/* Expand toggle */}
                    <td className="expand-cell">
                      {isParent && childCount > 0 ? (
                        <button className="toggle-btn" onClick={() => toggleParent(client.client_id)}>
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      ) : client.isChild ? (
                        <span className="child-indent">└</span>
                      ) : null}
                    </td>

                    {/* Client Name */}
                    <td className="name-cell">
                      <div className="client-name-row">
                        <span className={`client-name ${isParent ? 'parent-name' : ''}`}>
                          {client.client_name}
                        </span>
                        {isParent && childCount > 0 && (
                          <span className="child-count">{childCount} subs</span>
                        )}
                      </div>
                      <div className="client-id">{client.client_id}</div>
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`type-badge ${client.client_type}`}>
                        {client.client_type === 'parent' ? '🏢 Parent' : '🏷️ Sub'}
                      </span>
                    </td>

                    {/* Plan */}
                    <td>
                      {planBadge ? (
                        <span className="plan-badge" style={{ color: planBadge.color, background: planBadge.bg }}>
                          {planBadge.plan}
                        </span>
                      ) : (
                        <span className="plan-badge no-plan">—</span>
                      )}
                    </td>

                    {/* Members */}
                    <td className="members-cell">
                      {isParent ? (
                        <div>
                          <span className="member-total">{parentTotal.toLocaleString()}</span>
                          <span className="member-label">total</span>
                        </div>
                      ) : (
                        <span>{members > 0 ? members.toLocaleString() : '—'}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="contact-cell">
                      {client.contact_name ? (
                        <div>
                          <div className="contact-name">{client.contact_name}</div>
                          {client.contact_email && <div className="contact-email">{client.contact_email}</div>}
                        </div>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${(client.status || 'active').toLowerCase()}`}>
                        {(client.status || 'Active').charAt(0).toUpperCase() + (client.status || 'active').slice(1)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => alert(`Open client folder: ${client.client_id}`)}
                        title="View client folder"
                      >
                        📂
                      </button>
                    </td>
                  </tr>
                );
              })}

              {organized.filter(c => shouldShowRow(c)).length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    {searchTerm ? `No clients found matching "${searchTerm}"` : 'No clients found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .clients-page { max-width: 1400px; margin: 0 auto; }

        /* Header */
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .page-subtitle { color: #7aa0c0; font-size: 0.9rem; margin-top: 0.25rem; }
        .add-btn {
          background: linear-gradient(135deg, #1e3a5f, #2d5070);
          color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
          font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; transition: all 0.3s;
        }
        .add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45,80,112,0.4); }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card {
          background: linear-gradient(145deg, rgba(13,31,45,0.9), rgba(10,22,40,0.95));
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; padding: 1.25rem;
          text-align: center; transition: all 0.3s;
        }
        .stat-card:hover { transform: translateY(-3px); border-color: rgba(45,80,112,0.5); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .stat-card.gold { border-color: rgba(212,175,55,0.3); }
        .stat-card.green { border-color: rgba(45,80,112,0.3); }
        .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .stat-value { font-family: 'Montserrat', sans-serif; font-size: 2rem; font-weight: 700; color: #ffffff; }
        .stat-label { font-size: 0.85rem; color: #7aa0c0; margin-top: 0.25rem; }

        /* Toolbar */
        .toolbar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
        .search-box {
          flex: 1; min-width: 250px; position: relative; display: flex; align-items: center;
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3);
          border-radius: 12px; overflow: hidden;
        }
        .search-icon { padding: 0 0.75rem; font-size: 1rem; }
        .search-input {
          flex: 1; background: transparent; border: none; color: #ffffff;
          padding: 0.75rem 0.5rem; font-size: 0.9rem; outline: none;
        }
        .search-input::placeholder { color: #5a6a7a; }
        .search-clear {
          background: none; border: none; color: #7aa0c0; padding: 0 0.75rem;
          cursor: pointer; font-size: 1rem;
        }
        .search-clear:hover { color: #e74c3c; }
        .filter-group, .view-group { display: flex; gap: 0.25rem; }
        .filter-btn, .view-btn {
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.2);
          color: #7aa0c0; padding: 0.5rem 0.75rem; border-radius: 8px;
          font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .filter-btn.active, .view-btn.active {
          background: rgba(45,80,112,0.2); border-color: rgba(45,80,112,0.5);
          color: #4CAF50; font-weight: 600;
        }
        .filter-btn:hover, .view-btn:hover { border-color: rgba(45,80,112,0.4); color: rgba(184,212,232,0.7); }
        .expand-btn {
          background: none; border: 1px solid rgba(212,175,55,0.2);
          color: #D4AF37; padding: 0.5rem 0.75rem; border-radius: 8px;
          font-size: 0.8rem; cursor: pointer; font-family: inherit;
        }
        .expand-btn:hover { border-color: rgba(212,175,55,0.5); }

        /* Results count */
        .results-count { color: #5a6a7a; font-size: 0.85rem; margin-bottom: 0.75rem; }
        .search-tag {
          background: rgba(212,175,55,0.15); color: #D4AF37;
          padding: 0.15rem 0.5rem; border-radius: 6px; margin-left: 0.5rem;
          font-size: 0.8rem;
        }

        /* Table */
        .table-container {
          background: linear-gradient(145deg, rgba(13,31,45,0.9), rgba(10,22,40,0.95));
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px;
          overflow: hidden;
        }
        .table-scroll { overflow-x: auto; }
        .client-table { width: 100%; border-collapse: collapse; }
        .client-table th {
          font-family: 'Montserrat', sans-serif; font-size: 0.8rem; font-weight: 600;
          color: #D4AF37; text-align: left; padding: 1rem;
          border-bottom: 2px solid rgba(212,175,55,0.2);
          white-space: nowrap; text-transform: uppercase; letter-spacing: 1px;
        }
        .client-table td {
          padding: 0.75rem 1rem; border-bottom: 1px solid rgba(45,80,112,0.1);
          font-size: 0.9rem; color: rgba(184,212,232,0.7); vertical-align: middle;
        }

        /* Row types */
        .client-row { transition: background 0.2s; }
        .client-row:hover td { background: rgba(45,80,112,0.06); }
        .parent-row td { background: rgba(13,31,45,0.3); }
        .parent-row:hover td { background: rgba(45,80,112,0.12); }
        .child-row td { background: rgba(10,22,40,0.2); }
        .child-row:hover td { background: rgba(45,80,112,0.08); }

        /* Expand */
        .expand-cell { text-align: center; width: 40px; }
        .toggle-btn {
          background: none; border: none; color: #D4AF37;
          cursor: pointer; font-size: 0.85rem; padding: 0.25rem;
        }
        .toggle-btn:hover { color: #FFD700; }
        .child-indent { color: rgba(45,80,112,0.4); font-size: 0.9rem; }

        /* Name cell */
        .name-cell { min-width: 250px; }
        .client-name-row { display: flex; align-items: center; gap: 0.5rem; }
        .client-name { color: #ffffff; font-weight: 500; }
        .parent-name { font-weight: 700; color: #ffffff; }
        .child-count {
          font-size: 0.7rem; color: #7aa0c0;
          background: rgba(45,80,112,0.15); padding: 0.1rem 0.4rem;
          border-radius: 6px;
        }
        .client-id { font-size: 0.75rem; color: #5a6a7a; margin-top: 0.15rem; font-family: monospace; }

        /* Badges */
        .type-badge {
          padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
          white-space: nowrap;
        }
        .type-badge.parent { background: rgba(33,150,243,0.15); color: #42A5F5; }
        .type-badge.subsidiary { background: rgba(156,39,176,0.15); color: #BA68C8; }
        .plan-badge {
          padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem;
          font-weight: 700; letter-spacing: 0.5px;
        }
        .plan-badge.no-plan { color: #5a6a7a; background: none; }
        .status-badge {
          padding: 0.2rem 0.6rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600;
        }
        .status-badge.active { background: rgba(76,175,80,0.15); color: #4CAF50; }
        .status-badge.inactive { background: rgba(244,67,54,0.15); color: #EF5350; }
        .status-badge.pending { background: rgba(255,152,0,0.15); color: #FF9800; }

        /* Members */
        .members-cell { white-space: nowrap; }
        .member-total { font-weight: 700; color: #D4AF37; font-size: 1rem; }
        .member-label { font-size: 0.75rem; color: #7aa0c0; margin-left: 0.25rem; }

        /* Contact */
        .contact-cell { min-width: 160px; }
        .contact-name { color: rgba(184,212,232,0.7); font-size: 0.85rem; }
        .contact-email { color: #5a6a7a; font-size: 0.75rem; margin-top: 0.1rem; }
        .no-data { color: #3a4a5a; }

        /* Actions */
        .action-btn {
          background: rgba(45,80,112,0.1); border: 1px solid rgba(45,80,112,0.2);
          border-radius: 8px; padding: 0.35rem 0.5rem; cursor: pointer;
          font-size: 1rem; transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(45,80,112,0.25); border-color: rgba(45,80,112,0.5); }

        /* Empty */
        .empty-row { text-align: center; color: #5a6a7a; padding: 3rem 1rem !important; font-size: 1rem; }

        /* Responsive */
        @media (max-width: 1024px) {
          .toolbar { flex-direction: column; }
          .search-box { min-width: 100%; }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-value { font-size: 1.5rem; }
          .page-header { flex-direction: column; gap: 1rem; }
          .add-btn { width: 100%; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
          .filter-group { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
