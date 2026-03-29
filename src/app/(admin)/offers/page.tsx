'use client';

import { useState, useMemo } from 'react';
import CreateOfferForm from '@/components/offers/create-offer-form';
import ComparisonQuoteForm from '@/components/offers/comparison-quote-form';
import OfferAnalytics from '@/components/offers/offer-analytics';

// ── Types ────────────────────────────────────────────────────────────
interface OfferItem {
  plan_name: string;
  principals: number;
  dependents: number;
  reg_fee: number;
  fund_deposit: number;
  subtotal_reg: number;
  subtotal_fund: number;
}

interface Offer {
  offer_id: string;
  offer_type: 'standard' | 'comparison';
  client_id: string;
  client_name: string;
  contact_person?: string;
  contact_email?: string;
  status: string;
  created_date: string;
  offer_date?: string;
  total_principals: number;
  total_dependents: number;
  total_members: number;
  subtotal_reg_fees: number;
  subtotal_fund_deposit: number;
  subtotal_dental: number;
  grand_total_usd: number;
  includes_dental: boolean;
  items?: OfferItem[];
  gdrive_folder_url?: string;
}

// ── Status config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  draft:             { label: 'Draft',             color: '#90A4AE', bg: 'rgba(144,164,174,0.15)', icon: '📝' },
  sent:              { label: 'Sent',              color: '#42A5F5', bg: 'rgba(66,165,245,0.15)',  icon: '📧' },
  pending:           { label: 'Pending',           color: '#FF9800', bg: 'rgba(255,152,0,0.15)',   icon: '⏳' },
  'awaiting selection': { label: 'Awaiting',       color: '#FF9800', bg: 'rgba(255,152,0,0.15)',   icon: '⏳' },
  accepted:          { label: 'Accepted',          color: '#66BB6A', bg: 'rgba(102,187,106,0.15)', icon: '✅' },
  'pending_signature': { label: 'Pending Sign',    color: '#AB47BC', bg: 'rgba(171,71,188,0.15)',  icon: '✍️' },
  signed:            { label: 'Signed',            color: '#26A69A', bg: 'rgba(38,166,154,0.15)',  icon: '📜' },
  converted:         { label: 'Converted',         color: '#4CAF50', bg: 'rgba(76,175,80,0.15)',   icon: '🔄' },
  rejected:          { label: 'Rejected',          color: '#EF5350', bg: 'rgba(239,83,80,0.15)',   icon: '❌' },
  lost:              { label: 'Lost',              color: '#E57373', bg: 'rgba(229,115,115,0.15)', icon: '💀' },
  expired:           { label: 'Expired',           color: '#BDBDBD', bg: 'rgba(189,189,189,0.15)', icon: '⏰' },
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.draft;

// ── Dummy Data ───────────────────────────────────────────────────────
const DUMMY_OFFERS: Offer[] = [
  { offer_id: 'OFF-2025-0012', offer_type: 'standard', client_id: 'CLI-2026-0001', client_name: 'DIANA SHIPPING SERVICES SA', contact_person: 'John Papadopoulos', contact_email: 'jp@diana.gr', status: 'draft', created_date: '2025-03-15', total_principals: 180, total_dependents: 95, total_members: 275, subtotal_reg_fees: 6600, subtotal_fund_deposit: 41250, subtotal_dental: 2612.50, grand_total_usd: 50462.50, includes_dental: true, items: [{ plan_name: 'Gold', principals: 120, dependents: 60, reg_fee: 24, fund_deposit: 150, subtotal_reg: 4320, subtotal_fund: 27000 }, { plan_name: 'Platinum', principals: 60, dependents: 35, reg_fee: 24, fund_deposit: 150, subtotal_reg: 2280, subtotal_fund: 14250 }] },
  { offer_id: 'OFF-2025-0011', offer_type: 'standard', client_id: 'CLI-2026-0005', client_name: 'CENTROFIN', contact_person: 'Maria Konstantinou', contact_email: 'mk@centrofin.gr', status: 'sent', created_date: '2025-03-10', total_principals: 420, total_dependents: 210, total_members: 630, subtotal_reg_fees: 15120, subtotal_fund_deposit: 94500, subtotal_dental: 5985, grand_total_usd: 115605, includes_dental: true, items: [{ plan_name: 'Gold', principals: 200, dependents: 100, reg_fee: 24, fund_deposit: 150, subtotal_reg: 7200, subtotal_fund: 45000 }, { plan_name: 'Platinum', principals: 140, dependents: 70, reg_fee: 24, fund_deposit: 150, subtotal_reg: 5040, subtotal_fund: 31500 }, { plan_name: 'Silver', principals: 80, dependents: 40, reg_fee: 24, fund_deposit: 150, subtotal_reg: 2880, subtotal_fund: 18000 }] },
  { offer_id: 'OFF-2025-0010', offer_type: 'standard', client_id: 'CLI-2026-0022', client_name: 'CROSSWORLD MARINE SERVICES INC', contact_person: 'Carlos Santos', status: 'accepted', created_date: '2025-03-01', total_principals: 650, total_dependents: 320, total_members: 970, subtotal_reg_fees: 23280, subtotal_fund_deposit: 145500, subtotal_dental: 9215, grand_total_usd: 177995, includes_dental: true, items: [] },
  { offer_id: 'CQ-2025-0003', offer_type: 'comparison', client_id: 'CLI-2026-0040', client_name: 'GOLDEN UNION SHIPPING CO SA', contact_person: 'Eleni Georgiou', status: 'pending', created_date: '2025-02-28', total_principals: 280, total_dependents: 140, total_members: 420, subtotal_reg_fees: 10080, subtotal_fund_deposit: 63000, subtotal_dental: 3990, grand_total_usd: 77070, includes_dental: true, items: [] },
  { offer_id: 'OFF-2025-0009', offer_type: 'standard', client_id: 'CLI-2026-0015', client_name: 'ASTRA SHIPMANAGEMENT INC', contact_person: 'Nikos Andreou', status: 'pending_signature', created_date: '2025-02-20', total_principals: 145, total_dependents: 75, total_members: 220, subtotal_reg_fees: 5280, subtotal_fund_deposit: 33000, subtotal_dental: 2090, grand_total_usd: 40370, includes_dental: true, items: [] },
  { offer_id: 'OFF-2025-0008', offer_type: 'standard', client_id: 'CLI-2026-0047', client_name: 'OMICRON SHIP MANAGEMENT INC', contact_person: 'Dimitris Papas', status: 'signed', created_date: '2025-02-15', total_principals: 120, total_dependents: 55, total_members: 175, subtotal_reg_fees: 4200, subtotal_fund_deposit: 26250, subtotal_dental: 1662.50, grand_total_usd: 32112.50, includes_dental: true, items: [] },
  { offer_id: 'OFF-2025-0007', offer_type: 'standard', client_id: 'CLI-2026-0049', client_name: 'KYKLADES MARITIME CORPORATION', status: 'converted', created_date: '2025-02-10', total_principals: 95, total_dependents: 45, total_members: 140, subtotal_reg_fees: 3360, subtotal_fund_deposit: 21000, subtotal_dental: 1330, grand_total_usd: 25690, includes_dental: true, items: [] },
  { offer_id: 'CQ-2025-0002', offer_type: 'comparison', client_id: 'CLI-2026-0053', client_name: 'LEADER MARINE', contact_person: 'Alexandros Metaxas', status: 'rejected', created_date: '2025-02-01', total_principals: 240, total_dependents: 120, total_members: 360, subtotal_reg_fees: 8640, subtotal_fund_deposit: 54000, subtotal_dental: 3420, grand_total_usd: 66060, includes_dental: true, items: [] },
  { offer_id: 'OFF-2025-0006', offer_type: 'standard', client_id: 'CLI-2026-0038', client_name: 'EFNAV COMPANY LIMITED', status: 'expired', created_date: '2025-01-15', total_principals: 80, total_dependents: 35, total_members: 115, subtotal_reg_fees: 2760, subtotal_fund_deposit: 17250, subtotal_dental: 0, grand_total_usd: 20010, includes_dental: false, items: [] },
  { offer_id: 'OFF-2025-0005', offer_type: 'standard', client_id: 'CLI-2026-0051', client_name: 'MINOA MARINE LIMITED', status: 'draft', created_date: '2025-01-10', total_principals: 60, total_dependents: 25, total_members: 85, subtotal_reg_fees: 2040, subtotal_fund_deposit: 12750, subtotal_dental: 807.50, grand_total_usd: 15597.50, includes_dental: true, items: [] },
];

const fmt = (n: number) => n.toLocaleString();
const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ═══════════════════════════════════════════════════════════════════════
export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(DUMMY_OFFERS);
  const [loading, setLoading] = useState(false);
  const [searchClient, setSearchClient] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'standard' | 'comparison'>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Client list for the create form
  const dummyClients = [
    { client_id: 'CLI-2026-0001', client_name: 'DIANA SHIPPING SERVICES SA', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0002', client_name: 'DIANA GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001' },
    { client_id: 'CLI-2026-0003', client_name: 'DIANA PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001' },
    { client_id: 'CLI-2026-0004', client_name: 'DIANA MARINERS INC', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0001' },
    { client_id: 'CLI-2026-0005', client_name: 'CENTROFIN', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0006', client_name: 'CENTROFIN GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0007', client_name: 'CENTROFIN PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0008', client_name: 'CENTROFIN SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0009', client_name: 'CENTROFIN MARINE TRUST GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0010', client_name: 'CENTROFIN MARINE TRUST PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0011', client_name: 'CENTROFIN MARINE TRUST SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0012', client_name: 'CENTROFIN TRUST BULKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0013', client_name: 'CENTROFIN TRUST BULKERS PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0014', client_name: 'CENTROFIN TRUST BULKERS SILVER', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0005' },
    { client_id: 'CLI-2026-0015', client_name: 'ASTRA SHIPMANAGEMENT INC', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0016', client_name: 'ASTRA SHIPMANAGEMENT GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015' },
    { client_id: 'CLI-2026-0017', client_name: 'ASTRA TANKERS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0015' },
    { client_id: 'CLI-2026-0018', client_name: 'AIMS ADELE SHIPHOLDING LTD', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0019', client_name: 'AIMS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0018' },
    { client_id: 'CLI-2026-0020', client_name: 'ANOSIS MARITIME SA', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0021', client_name: 'ANOSIS PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0020' },
    { client_id: 'CLI-2026-0022', client_name: 'CROSSWORLD MARINE SERVICES INC', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0023', client_name: 'CROSSWORLD STAF&FAM GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022' },
    { client_id: 'CLI-2026-0024', client_name: 'CROSSWORLD STAF&FAM PLATINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022' },
    { client_id: 'CLI-2026-0025', client_name: 'BOURBON GOLD CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022' },
    { client_id: 'CLI-2026-0026', client_name: 'BOURBON PLATINUN CW', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0022' },
    { client_id: 'CLI-2026-0038', client_name: 'EFNAV COMPANY LIMITED', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0039', client_name: 'EFNAV GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0038' },
    { client_id: 'CLI-2026-0040', client_name: 'GOLDEN UNION SHIPPING CO SA', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0041', client_name: 'GOLDEN UNION SHIPPING GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040' },
    { client_id: 'CLI-2026-0042', client_name: 'GOLDEN UNION SHIPPING PALTINUN', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0040' },
    { client_id: 'CLI-2026-0045', client_name: 'HEALTHPLUS DIAGNOSTIC CLINIC INC', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0046', client_name: 'HEALTHPLUS GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0045' },
    { client_id: 'CLI-2026-0047', client_name: 'OMICRON SHIP MANAGEMENT INC', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0048', client_name: 'OMICRON GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0047' },
    { client_id: 'CLI-2026-0049', client_name: 'KYKLADES MARITIME CORPORATION', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0050', client_name: 'KYKLADES PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0049' },
    { client_id: 'CLI-2026-0051', client_name: 'MINOA MARINE LIMITED', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0052', client_name: 'MINOA GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0051' },
    { client_id: 'CLI-2026-0053', client_name: 'LEADER MARINE', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0054', client_name: 'LEADER MARINE AQUILA BULKERS INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053' },
    { client_id: 'CLI-2026-0055', client_name: 'LEADER MARINE FALCON SHIPHOLDING INC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0053' },
    { client_id: 'CLI-2026-0061', client_name: 'IONIC', client_type: 'parent', parent_client_id: null },
    { client_id: 'CLI-2026-0062', client_name: 'IONIC GOLD', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061' },
    { client_id: 'CLI-2026-0063', client_name: 'IONIC PLATINUM', client_type: 'subsidiary', parent_client_id: 'CLI-2026-0061' },
  ];

  // ── Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const o = offers;
    return {
      total: o.length,
      draft: o.filter(x => x.status.toLowerCase() === 'draft').length,
      sent: o.filter(x => ['sent', 'awaiting selection', 'pending'].includes(x.status.toLowerCase())).length,
      accepted: o.filter(x => ['accepted', 'converted', 'signed', 'pending_signature'].includes(x.status.toLowerCase())).length,
      rejected: o.filter(x => ['rejected', 'lost', 'expired'].includes(x.status.toLowerCase())).length,
      totalValue: o.reduce((sum, x) => sum + (x.grand_total_usd || 0), 0),
      totalMembers: o.reduce((sum, x) => sum + (x.total_members || 0), 0),
    };
  }, [offers]);

  // ── Filter ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = offers;
    if (searchClient.trim()) {
      const term = searchClient.toLowerCase();
      list = list.filter(o => o.client_name.toLowerCase().includes(term) || o.offer_id.toLowerCase().includes(term));
    }
    if (statusFilter !== 'all') {
      list = list.filter(o => {
        const s = o.status.toLowerCase();
        if (statusFilter === 'draft') return s === 'draft';
        if (statusFilter === 'sent') return ['sent', 'awaiting selection', 'pending'].includes(s);
        if (statusFilter === 'accepted') return ['accepted', 'converted', 'signed', 'pending_signature'].includes(s);
        if (statusFilter === 'rejected') return ['rejected', 'lost', 'expired'].includes(s);
        return true;
      });
    }
    if (typeFilter !== 'all') {
      list = list.filter(o => o.offer_type === typeFilter);
    }
    return list;
  }, [offers, searchClient, statusFilter, typeFilter]);

  // ── View offer detail ────────────────────────────────────────────
  const openDetail = (offer: Offer) => { setSelectedOffer(offer); setShowDetail(true); };
  const closeDetail = () => { setShowDetail(false); setSelectedOffer(null); };

  return (
    <div className="offers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Offers Center</h1>
          <p className="page-subtitle">Create, track and manage proposals & comparison quotes</p>
        </div>
        <div className="header-actions">
          <button className={`btn-create analytics ${showAnalytics ? 'active' : ''}`} onClick={() => setShowAnalytics(!showAnalytics)}>
            📊 Analytics
          </button>
          <button className="btn-create comparison" onClick={() => setShowComparison(true)}>
            📊 New Comparison
          </button>
          <button className="btn-create standard" onClick={() => setShowCreate(true)}>
            + New Offer
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <OfferAnalytics
          offers={offers}
          onFilterByStatus={(status) => { setStatusFilter(status); setShowAnalytics(false); }}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Stats Cards - hidden when analytics is open */}
      {!showAnalytics && (
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setStatusFilter('all')}>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Offers</div>
          <div className="stat-sub">{fmtUSD(stats.totalValue)}</div>
        </div>
        <div className="stat-card draft" onClick={() => setStatusFilter('draft')}>
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.draft}</div>
          <div className="stat-label">Draft</div>
        </div>
        <div className="stat-card sent" onClick={() => setStatusFilter('sent')}>
          <div className="stat-icon">📧</div>
          <div className="stat-value">{stats.sent}</div>
          <div className="stat-label">Sent / Pending</div>
        </div>
        <div className="stat-card accepted" onClick={() => setStatusFilter('accepted')}>
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.accepted}</div>
          <div className="stat-label">Accepted / Signed</div>
        </div>
        <div className="stat-card rejected" onClick={() => setStatusFilter('rejected')}>
          <div className="stat-icon">❌</div>
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected / Expired</div>
        </div>
      </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by client name or offer ID..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
            className="search-input"
          />
          {searchClient && <button className="search-clear" onClick={() => setSearchClient('')}>✕</button>}
        </div>
        <div className="filter-group">
          {(['all', 'standard', 'comparison'] as const).map(t => (
            <button key={t} className={`filter-btn ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Types' : t === 'standard' ? '📋 Standard' : '📊 Comparison'}
            </button>
          ))}
        </div>
        {statusFilter !== 'all' && (
          <button className="clear-filter" onClick={() => setStatusFilter('all')}>
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="results-count">
        Showing {filtered.length} of {offers.length} offers
        {statusFilter !== 'all' && <span className="filter-tag">{statusFilter}</span>}
      </div>

      {/* Offers Table */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="offers-table">
            <thead>
              <tr>
                <th>Offer ID</th>
                <th>Client</th>
                <th>Type</th>
                <th>Members</th>
                <th>Total (USD)</th>
                <th>Dental</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(offer => {
                const sc = getStatusConfig(offer.status);
                const isComparison = offer.offer_type === 'comparison';
                return (
                  <tr key={offer.offer_id} className="offer-row">
                    <td>
                      <span className="offer-id">{offer.offer_id}</span>
                    </td>
                    <td className="client-cell">
                      <div className="client-name">{offer.client_name}</div>
                      {offer.contact_person && <div className="contact-name">{offer.contact_person}</div>}
                    </td>
                    <td>
                      <span className={`type-badge ${offer.offer_type}`}>
                        {isComparison ? '📊 CQ' : '📋 STD'}
                      </span>
                    </td>
                    <td className="members-cell">
                      <div className="members-total">{fmt(offer.total_members)}</div>
                      <div className="members-detail">{offer.total_principals}P + {offer.total_dependents}D</div>
                    </td>
                    <td className="amount-cell">{fmtUSD(offer.grand_total_usd)}</td>
                    <td>
                      <span className={`dental-badge ${offer.includes_dental ? 'yes' : 'no'}`}>
                        {offer.includes_dental ? '🦷 Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: sc.color, background: sc.bg }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(offer.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="action-group">
                        <button className="action-btn view" onClick={() => openDetail(offer)} title="View Details">👁️</button>
                        {offer.status === 'draft' && (
                          <button className="action-btn send" title="Send Offer">📧</button>
                        )}
                        <button className="action-btn docs" title="Documents">📄</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="empty-row">No offers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offer Detail Modal */}
      {showDetail && selectedOffer && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">
                  {selectedOffer.offer_type === 'comparison' ? '📊' : '📋'} {selectedOffer.offer_id}
                </h2>
                <p className="modal-subtitle">{selectedOffer.client_name}</p>
              </div>
              <button className="modal-close" onClick={closeDetail}>✕</button>
            </div>

            <div className="modal-body">
              {/* Status + Date */}
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="status-badge" style={{
                    color: getStatusConfig(selectedOffer.status).color,
                    background: getStatusConfig(selectedOffer.status).bg
                  }}>
                    {getStatusConfig(selectedOffer.status).icon} {getStatusConfig(selectedOffer.status).label}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{new Date(selectedOffer.created_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type</span>
                  <span className={`type-badge ${selectedOffer.offer_type}`}>
                    {selectedOffer.offer_type === 'comparison' ? '📊 Comparison Quote' : '📋 Standard Offer'}
                  </span>
                </div>
              </div>

              {/* Contact info */}
              {selectedOffer.contact_person && (
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Contact</span>
                    <span className="detail-value">{selectedOffer.contact_person}</span>
                  </div>
                  {selectedOffer.contact_email && (
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedOffer.contact_email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Summary */}
              <div className="detail-section-title">💰 Financial Summary</div>
              <div className="financial-grid">
                <div className="fin-card">
                  <div className="fin-label">Members</div>
                  <div className="fin-value">{fmt(selectedOffer.total_members)}</div>
                  <div className="fin-sub">{selectedOffer.total_principals} principals + {selectedOffer.total_dependents} dependents</div>
                </div>
                <div className="fin-card">
                  <div className="fin-label">Registration Fees</div>
                  <div className="fin-value">{fmtUSD(selectedOffer.subtotal_reg_fees)}</div>
                </div>
                <div className="fin-card">
                  <div className="fin-label">Fund Deposit</div>
                  <div className="fin-value">{fmtUSD(selectedOffer.subtotal_fund_deposit)}</div>
                </div>
                <div className="fin-card">
                  <div className="fin-label">Dental</div>
                  <div className="fin-value">{selectedOffer.includes_dental ? fmtUSD(selectedOffer.subtotal_dental) : '—'}</div>
                </div>
                <div className="fin-card total">
                  <div className="fin-label">Grand Total</div>
                  <div className="fin-value gold">{fmtUSD(selectedOffer.grand_total_usd)}</div>
                </div>
              </div>

              {/* Plan Items */}
              {selectedOffer.items && selectedOffer.items.length > 0 && (
                <>
                  <div className="detail-section-title">📋 Plan Breakdown</div>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Principals</th>
                        <th>Dependents</th>
                        <th>Reg Fee</th>
                        <th>Fund Deposit</th>
                        <th>Subtotal Reg</th>
                        <th>Subtotal Fund</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOffer.items.map((item, i) => (
                        <tr key={i}>
                          <td><strong>{item.plan_name}</strong></td>
                          <td>{item.principals}</td>
                          <td>{item.dependents}</td>
                          <td>${item.reg_fee}</td>
                          <td>${item.fund_deposit}</td>
                          <td>{fmtUSD(item.subtotal_reg)}</td>
                          <td>{fmtUSD(item.subtotal_fund)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Action Buttons */}
              <div className="modal-actions">
                {selectedOffer.status === 'draft' && (
                  <button className="modal-btn send">📧 Send Offer</button>
                )}
                <button className="modal-btn docs">📄 Generate Proposal</button>
                <button className="modal-btn nda">📜 NDA</button>
                {selectedOffer.offer_type !== 'comparison' && (
                  <>
                    <button className="modal-btn dpa">🔒 DPA</button>
                    <button className="modal-btn asa">📋 ASA</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Offer Form */}
      {showCreate && (
        <CreateOfferForm
          clients={dummyClients}
          onClose={() => setShowCreate(false)}
          onSave={(offerData) => {
            const newOffer: Offer = {
              offer_id: `OFF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
              offer_type: 'standard',
              status: 'draft',
              created_date: new Date().toISOString().split('T')[0],
              ...offerData,
            };
            setOffers(prev => [newOffer, ...prev]);
            setShowCreate(false);
            alert(`✅ Offer ${newOffer.offer_id} saved as Draft!`);
          }}
        />
      )}

      {showComparison && (
        <ComparisonQuoteForm
          clients={dummyClients}
          onClose={() => setShowComparison(false)}
          onSave={(offerData) => {
            const newOffer: Offer = {
              offer_id: `CQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
              offer_type: 'comparison',
              status: 'draft',
              created_date: new Date().toISOString().split('T')[0],
              ...offerData,
            };
            setOffers(prev => [newOffer, ...prev]);
            setShowComparison(false);
            alert(`✅ Comparison Quote ${newOffer.offer_id} saved as Draft!`);
          }}
        />
      )}

      <style jsx>{`
        .offers-page { max-width: 1400px; margin: 0 auto; }

        /* Header */
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #ffffff; }
        .page-subtitle { color: #7aa0c0; font-size: 0.9rem; margin-top: 0.25rem; }
        .header-actions { display: flex; gap: 0.75rem; }
        .btn-create {
          border: none; padding: 0.75rem 1.25rem; border-radius: 12px;
          font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.85rem;
          cursor: pointer; transition: all 0.3s;
        }
        .btn-create.standard { background: linear-gradient(135deg, #1e3a5f, #2d5070); color: white; }
        .btn-create.comparison { background: linear-gradient(135deg, #6d28d9, #8b5cf6); color: white; }
        .btn-create.analytics { background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; }
        .btn-create.analytics.active { box-shadow: 0 0 20px rgba(231,76,60,0.5); }
        .btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }

        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-card {
          background: linear-gradient(145deg, rgba(13,31,45,0.9), rgba(10,22,40,0.95));
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; padding: 1.25rem;
          text-align: center; cursor: pointer; transition: all 0.3s;
        }
        .stat-card:hover { transform: translateY(-3px); border-color: rgba(45,80,112,0.5); }
        .stat-card.draft { border-left: 4px solid #90A4AE; }
        .stat-card.sent { border-left: 4px solid #42A5F5; }
        .stat-card.accepted { border-left: 4px solid #66BB6A; }
        .stat-card.rejected { border-left: 4px solid #EF5350; }
        .stat-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .stat-value { font-family: 'Montserrat', sans-serif; font-size: 2rem; font-weight: 700; color: #ffffff; }
        .stat-label { font-size: 0.85rem; color: #7aa0c0; }
        .stat-sub { font-size: 0.8rem; color: #D4AF37; margin-top: 0.25rem; font-weight: 600; }

        /* Toolbar */
        .toolbar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
        .search-box {
          flex: 1; min-width: 250px; display: flex; align-items: center;
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.3);
          border-radius: 12px; overflow: hidden;
        }
        .search-icon { padding: 0 0.75rem; }
        .search-input { flex: 1; background: transparent; border: none; color: #ffffff; padding: 0.75rem 0.5rem; font-size: 0.9rem; outline: none; }
        .search-input::placeholder { color: #5a6a7a; }
        .search-clear { background: none; border: none; color: #7aa0c0; padding: 0 0.75rem; cursor: pointer; }
        .filter-group { display: flex; gap: 0.25rem; }
        .filter-btn {
          background: rgba(10,22,40,0.7); border: 1px solid rgba(45,80,112,0.2);
          color: #7aa0c0; padding: 0.5rem 0.75rem; border-radius: 8px;
          font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .filter-btn.active { background: rgba(45,80,112,0.2); border-color: rgba(45,80,112,0.5); color: #4CAF50; font-weight: 600; }
        .clear-filter {
          background: rgba(239,83,80,0.1); border: 1px solid rgba(239,83,80,0.3);
          color: #EF5350; padding: 0.4rem 0.75rem; border-radius: 8px;
          font-size: 0.8rem; cursor: pointer; font-family: inherit;
        }

        .results-count { color: #5a6a7a; font-size: 0.85rem; margin-bottom: 0.75rem; }
        .filter-tag { background: rgba(212,175,55,0.15); color: #D4AF37; padding: 0.15rem 0.5rem; border-radius: 6px; margin-left: 0.5rem; font-size: 0.8rem; text-transform: capitalize; }

        /* Table */
        .table-container {
          background: linear-gradient(145deg, rgba(13,31,45,0.9), rgba(10,22,40,0.95));
          border: 1px solid rgba(45,80,112,0.25); border-radius: 16px; overflow: hidden;
        }
        .table-scroll { overflow-x: auto; }
        .offers-table { width: 100%; border-collapse: collapse; }
        .offers-table th {
          font-family: 'Montserrat', sans-serif; font-size: 0.8rem; font-weight: 600;
          color: #D4AF37; text-align: left; padding: 1rem;
          border-bottom: 2px solid rgba(212,175,55,0.2); white-space: nowrap;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .offers-table td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(45,80,112,0.1); font-size: 0.9rem; color: rgba(184,212,232,0.7); }
        .offer-row { transition: background 0.2s; }
        .offer-row:hover td { background: rgba(45,80,112,0.06); }

        .offer-id { font-family: monospace; color: #D4AF37; font-weight: 600; font-size: 0.85rem; }
        .client-cell { min-width: 200px; }
        .client-name { color: #ffffff; font-weight: 600; }
        .contact-name { font-size: 0.75rem; color: #5a6a7a; margin-top: 0.1rem; }
        .type-badge { padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .type-badge.standard { background: rgba(33,150,243,0.15); color: #42A5F5; }
        .type-badge.comparison { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .members-cell { white-space: nowrap; }
        .members-total { font-weight: 700; color: #ffffff; }
        .members-detail { font-size: 0.7rem; color: #5a6a7a; }
        .amount-cell { font-weight: 600; color: #4CAF50; white-space: nowrap; }
        .dental-badge { padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.8rem; }
        .dental-badge.yes { background: rgba(76,175,80,0.1); color: #4CAF50; }
        .dental-badge.no { color: #5a6a7a; }
        .status-badge { padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
        .date-cell { white-space: nowrap; font-size: 0.85rem; color: #7aa0c0; }
        .action-group { display: flex; gap: 0.25rem; }
        .action-btn {
          background: rgba(45,80,112,0.1); border: 1px solid rgba(45,80,112,0.2);
          border-radius: 8px; padding: 0.35rem 0.5rem; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(45,80,112,0.25); border-color: rgba(45,80,112,0.5); }
        .empty-row { text-align: center; color: #5a6a7a; padding: 3rem 1rem !important; }

        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 2rem;
        }
        .modal-box {
          background: linear-gradient(145deg, #0d1f0d, #0a1a0a);
          border: 1px solid rgba(45,80,112,0.3); border-radius: 20px;
          width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.5rem; border-bottom: 1px solid rgba(45,80,112,0.2);
        }
        .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; font-weight: 700; color: #D4AF37; }
        .modal-subtitle { color: rgba(184,212,232,0.7); font-size: 0.9rem; margin-top: 0.25rem; }
        .modal-close { background: none; border: none; color: #7aa0c0; font-size: 1.5rem; cursor: pointer; }
        .modal-close:hover { color: #e74c3c; }
        .modal-body { padding: 1.5rem; }

        .detail-row { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .detail-item { flex: 1; min-width: 150px; }
        .detail-label { font-size: 0.8rem; color: #5a6a7a; margin-bottom: 0.25rem; display: block; }
        .detail-value { color: #ffffff; font-size: 0.95rem; }
        .detail-section-title {
          font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700;
          color: #ffffff; margin: 1.5rem 0 1rem; padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(45,80,112,0.2);
        }

        .financial-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .fin-card {
          background: rgba(10,22,40,0.5); border: 1px solid rgba(45,80,112,0.15);
          border-radius: 12px; padding: 1rem; text-align: center;
        }
        .fin-card.total { border-color: rgba(212,175,55,0.3); background: rgba(212,175,55,0.08); grid-column: 1 / -1; }
        .fin-label { font-size: 0.8rem; color: #7aa0c0; }
        .fin-value { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; font-weight: 700; color: #ffffff; margin: 0.25rem 0; }
        .fin-value.gold { color: #D4AF37; font-size: 1.6rem; }
        .fin-sub { font-size: 0.75rem; color: #5a6a7a; }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .items-table th { font-size: 0.75rem; color: #7aa0c0; text-align: left; padding: 0.5rem; border-bottom: 1px solid rgba(45,80,112,0.2); }
        .items-table td { font-size: 0.85rem; color: rgba(184,212,232,0.7); padding: 0.5rem; border-bottom: 1px solid rgba(45,80,112,0.1); }

        .modal-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(45,80,112,0.2); }
        .modal-btn {
          padding: 0.6rem 1rem; border-radius: 10px; border: none;
          font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .modal-btn.send { background: #3498db; color: white; }
        .modal-btn.docs { background: #1e3a5f; color: white; }
        .modal-btn.nda { background: #e67e22; color: white; }
        .modal-btn.dpa { background: #9b59b6; color: white; }
        .modal-btn.asa { background: #27ae60; color: white; }
        .modal-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
          .toolbar { flex-direction: column; }
          .financial-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .page-header { flex-direction: column; }
          .header-actions { width: 100%; }
          .btn-create { flex: 1; }
          .financial-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
