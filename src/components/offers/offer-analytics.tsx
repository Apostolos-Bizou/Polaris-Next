'use client';

import { useMemo } from 'react';
import './offer-analytics.css';

interface Offer {
  offer_id: string;
  offer_type: string;
  client_id: string;
  client_name: string;
  status: string;
  created_date: string;
  total_members: number;
  grand_total_usd: number;
}

interface OfferAnalyticsProps {
  offers: Offer[];
  onFilterByStatus: (status: string) => void;
  onClose: () => void;
}

const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }); }
  catch { return d; }
};

export default function OfferAnalytics({ offers, onFilterByStatus, onClose }: OfferAnalyticsProps) {
  // ─── Computed stats ───────────────────────────────
  const stats = useMemo(() => {
    const total = offers.length;
    const draft = offers.filter(o => o.status.toLowerCase() === 'draft').length;
    const sent = offers.filter(o => ['sent', 'awaiting selection', 'pending'].includes(o.status.toLowerCase())).length;
    const accepted = offers.filter(o => ['accepted', 'converted', 'signed', 'pending_signature'].includes(o.status.toLowerCase())).length;
    const rejected = offers.filter(o => ['rejected', 'lost', 'expired'].includes(o.status.toLowerCase())).length;
    const totalRevenue = offers.reduce((s, o) => s + (o.grand_total_usd || 0), 0);
    const totalMembers = offers.reduce((s, o) => s + (o.total_members || 0), 0);
    const avgValue = total > 0 ? totalRevenue / total : 0;
    const conversion = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return { total, draft, sent, accepted, rejected, totalRevenue, totalMembers, avgValue, conversion };
  }, [offers]);

  // ─── Pipeline funnel bars ──────────────────────────
  const funnelData = useMemo(() => {
    const max = Math.max(stats.draft, stats.sent, stats.accepted, stats.rejected, 1);
    return [
      { label: 'Draft', count: stats.draft, pct: (stats.draft / max) * 100, color: '#6c757d', bg: 'rgba(108,117,125,0.2)' },
      { label: 'Sent', count: stats.sent, pct: (stats.sent / max) * 100, color: '#3498db', bg: 'rgba(52,152,219,0.2)' },
      { label: 'Won', count: stats.accepted, pct: (stats.accepted / max) * 100, color: '#27ae60', bg: 'rgba(39,174,96,0.2)' },
      { label: 'Lost', count: stats.rejected, pct: (stats.rejected / max) * 100, color: '#e74c3c', bg: 'rgba(231,76,60,0.2)' },
    ];
  }, [stats]);

  // ─── Top clients by offers ────────────────────────
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; count: number; members: number; value: number }> = {};
    offers.forEach(o => {
      if (!map[o.client_id]) map[o.client_id] = { name: o.client_name, count: 0, members: 0, value: 0 };
      map[o.client_id].count++;
      map[o.client_id].members += o.total_members || 0;
      map[o.client_id].value += o.grand_total_usd || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [offers]);

  // ─── Recent Activity ──────────────────────────────
  const recentActivity = useMemo(() => {
    return [...offers]
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .slice(0, 6);
  }, [offers]);

  // ─── Follow-up stats (based on offer age) ─────────
  const followUpStats = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    const active = offers.filter(o => !['accepted', 'converted', 'signed', 'rejected', 'lost', 'expired'].includes(o.status.toLowerCase()));
    return {
      overdue: active.filter(o => (now - new Date(o.created_date).getTime()) > 30 * day).length,
      dueToday: active.filter(o => {
        const age = now - new Date(o.created_date).getTime();
        return age > 7 * day && age <= 14 * day;
      }).length,
      upcoming: active.filter(o => (now - new Date(o.created_date).getTime()) <= 7 * day).length,
      completed: offers.filter(o => ['accepted', 'converted', 'signed'].includes(o.status.toLowerCase())).length,
    };
  }, [offers]);

  return (
    <div className="oa-dashboard">
      {/* Header */}
      <div className="oa-header">
        <div className="oa-header-left">
          <span className="oa-header-icon">📊</span>
          <div>
            <h2 className="oa-title">Offer Analytics Dashboard</h2>
            <p className="oa-subtitle">Pipeline • Revenue • Follow-ups • Email Tracking</p>
          </div>
        </div>
        <div className="oa-header-right">
          <button className="oa-close-btn" onClick={onClose}>✕ Close Analytics</button>
        </div>
      </div>

      {/* ─── KPI Cards Row ─────────────────────────────── */}
      <div className="oa-kpi-row">
        <button className="oa-kpi total" onClick={() => onFilterByStatus('all')}>
          <div className="oa-kpi-value gold">{stats.total}</div>
          <div className="oa-kpi-label">Total Offers</div>
          <div className="oa-kpi-icon-bg">📋</div>
        </button>
        <button className="oa-kpi draft" onClick={() => onFilterByStatus('draft')}>
          <div className="oa-kpi-value">{stats.draft}</div>
          <div className="oa-kpi-label">Draft</div>
          <div className="oa-kpi-icon-bg">📝</div>
        </button>
        <button className="oa-kpi sent" onClick={() => onFilterByStatus('sent')}>
          <div className="oa-kpi-value">{stats.sent}</div>
          <div className="oa-kpi-label">Sent</div>
          <div className="oa-kpi-icon-bg">📤</div>
        </button>
        <button className="oa-kpi accepted" onClick={() => onFilterByStatus('accepted')}>
          <div className="oa-kpi-value">{stats.accepted}</div>
          <div className="oa-kpi-label">Accepted</div>
          <div className="oa-kpi-icon-bg">✅</div>
        </button>
        <button className="oa-kpi rejected" onClick={() => onFilterByStatus('rejected')}>
          <div className="oa-kpi-value">{stats.rejected}</div>
          <div className="oa-kpi-label">Rejected</div>
          <div className="oa-kpi-icon-bg">❌</div>
        </button>
      </div>

      {/* ─── Second Row: Pipeline + Revenue + Follow-up ── */}
      <div className="oa-three-col">
        {/* Pipeline Funnel */}
        <div className="oa-card wide">
          <div className="oa-card-header">
            <h3 className="oa-card-title">📈 Pipeline Funnel</h3>
            <span className="oa-conversion-badge">{stats.conversion}% conversion</span>
          </div>
          <div className="oa-funnel">
            {funnelData.map(bar => (
              <div key={bar.label} className="oa-funnel-row">
                <span className="oa-funnel-label">{bar.label}</span>
                <div className="oa-funnel-track" style={{ background: bar.bg }}>
                  <div
                    className="oa-funnel-fill"
                    style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.color}, ${bar.color}cc)` }}
                  >
                    {bar.count > 0 && <span className="oa-funnel-count">{bar.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Potential */}
        <div className="oa-card">
          <h3 className="oa-card-title">💰 Revenue Potential</h3>
          <div className="oa-revenue-hero">
            <div className="oa-revenue-value">{fmtUSD(stats.totalRevenue)}</div>
            <div className="oa-revenue-label">Total Pipeline</div>
          </div>
          <div className="oa-revenue-grid">
            <div className="oa-revenue-stat">
              <div className="oa-rs-value blue">{stats.totalMembers.toLocaleString()}</div>
              <div className="oa-rs-label">Members</div>
            </div>
            <div className="oa-revenue-stat">
              <div className="oa-rs-value purple">{fmtUSD(Math.round(stats.avgValue))}</div>
              <div className="oa-rs-label">Avg Value</div>
            </div>
          </div>
        </div>

        {/* Follow-up Status */}
        <div className="oa-card">
          <h3 className="oa-card-title">📝 Follow-up Status</h3>
          <div className="oa-followup-list">
            <div className="oa-followup-row overdue">
              <span className="oa-fu-dot">🔴</span>
              <span className="oa-fu-label">Overdue</span>
              <span className="oa-fu-count red">{followUpStats.overdue}</span>
            </div>
            <div className="oa-followup-row today">
              <span className="oa-fu-dot">🟡</span>
              <span className="oa-fu-label">Due Today</span>
              <span className="oa-fu-count orange">{followUpStats.dueToday}</span>
            </div>
            <div className="oa-followup-row upcoming">
              <span className="oa-fu-dot">🔵</span>
              <span className="oa-fu-label">Upcoming</span>
              <span className="oa-fu-count blue">{followUpStats.upcoming}</span>
            </div>
            <div className="oa-followup-row completed">
              <span className="oa-fu-dot">🟢</span>
              <span className="oa-fu-label">Completed</span>
              <span className="oa-fu-count green">{followUpStats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Third Row: Email Tracking + Activity + Top Clients ── */}
      <div className="oa-three-col">
        {/* Email Tracking */}
        <div className="oa-card">
          <div className="oa-card-header">
            <h3 className="oa-card-title">📧 Email Tracking</h3>
            <span className="oa-card-badge">Last 30 days</span>
          </div>
          <div className="oa-email-grid">
            <div className="oa-email-stat">
              <div className="oa-es-value blue">{stats.sent + stats.accepted}</div>
              <div className="oa-es-label">Emails Sent</div>
            </div>
            <div className="oa-email-stat">
              <div className="oa-es-value green">{stats.sent + stats.accepted}</div>
              <div className="oa-es-label">Delivered</div>
            </div>
          </div>
          <div className="oa-email-note">
            <a href="/email" className="oa-email-link">📧 View all in Email Center →</a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="oa-card">
          <div className="oa-card-header">
            <h3 className="oa-card-title">📅 Recent Activity</h3>
            <button className="oa-view-all" onClick={() => { onClose(); onFilterByStatus('all'); }}>View All →</button>
          </div>
          <div className="oa-activity-list">
            {recentActivity.map(o => {
              const sc = getStatusMini(o.status);
              return (
                <div key={o.offer_id} className="oa-activity-item">
                  <span className="oa-act-icon">{sc.icon}</span>
                  <div className="oa-act-info">
                    <span className="oa-act-client">{o.client_name}</span>
                    <span className="oa-act-id">{o.offer_id} • {fmtDate(o.created_date)}</span>
                  </div>
                  <span className="oa-act-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Clients */}
        <div className="oa-card">
          <h3 className="oa-card-title">🏢 Top Clients</h3>
          <div className="oa-top-clients">
            {topClients.map((c, i) => (
              <div key={i} className="oa-tc-row">
                <div className="oa-tc-rank">{i + 1}</div>
                <div className="oa-tc-info">
                  <span className="oa-tc-name">{c.name}</span>
                  <span className="oa-tc-detail">{c.members.toLocaleString()} members • {fmtUSD(c.value)}</span>
                </div>
                <span className="oa-tc-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusMini(status: string) {
  const s = status.toLowerCase();
  if (s === 'draft') return { label: 'draft', color: '#90A4AE', bg: 'rgba(144,164,174,0.2)', icon: '📝' };
  if (['sent', 'pending', 'awaiting selection'].includes(s)) return { label: 'sent', color: '#42A5F5', bg: 'rgba(66,165,245,0.2)', icon: '📤' };
  if (['accepted', 'signed', 'converted', 'pending_signature'].includes(s)) return { label: 'accepted', color: '#66BB6A', bg: 'rgba(102,187,106,0.2)', icon: '✅' };
  if (['rejected', 'lost', 'expired'].includes(s)) return { label: 'rejected', color: '#EF5350', bg: 'rgba(239,83,80,0.2)', icon: '❌' };
  return { label: s, color: '#90A4AE', bg: 'rgba(144,164,174,0.2)', icon: '📋' };
}
