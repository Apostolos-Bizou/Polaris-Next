'use client';

import { useState, useMemo } from 'react';
import { useCompare, ClientKPIs, CompareClientData } from '@/hooks/use-compare';
import './compare.css';

// ─── Helpers ─────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toLocaleString();
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

function pctDiff(a: number, b: number): { value: string; cls: string } {
  if (b === 0 && a === 0) return { value: '—', cls: 'neutral' };
  if (b === 0) return { value: '+∞', cls: 'higher' };
  const diff = ((a - b) / b) * 100;
  if (Math.abs(diff) < 0.5) return { value: '≈ same', cls: 'neutral' };
  return {
    value: (diff > 0 ? '+' : '') + diff.toFixed(1) + '%',
    cls: diff > 0 ? 'higher' : 'lower',
  };
}

// "Winner" indicator - who has more (for KPIs where more = better)
function winnerDot(a: number, b: number, metric: 'higher' | 'lower' = 'higher'): 'A' | 'B' | 'tie' {
  if (a === b) return 'tie';
  if (metric === 'higher') return a > b ? 'A' : 'B';
  return a < b ? 'A' : 'B';
}

// ─── Main Component ─────────────────────────────────────────────
export default function ComparePage() {
  const { clients, clientsLoading, clientA, clientB, comparing, runComparison, clearComparison } = useCompare();

  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  // Group clients for selector
  const groupedClients = useMemo(() => {
    const parents = clients.filter(c => c.isParent);
    const standalone = clients.filter(c => !c.isParent && !c.isSubsidiary);
    const subsidiaries = clients.filter(c => c.isSubsidiary);

    return { parents, standalone, subsidiaries, all: clients };
  }, [clients]);

  const handleCompare = () => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      runComparison(selectedA, selectedB);
    }
  };

  const handleSwap = () => {
    const tmpA = selectedA;
    setSelectedA(selectedB);
    setSelectedB(tmpA);
    if (clientA && clientB) {
      runComparison(selectedB, selectedA);
    }
  };

  const hasResults = clientA && clientB && !clientA.loading && !clientB.loading;

  return (
    <div className="compare-page">
      {/* Header */}
      <div className="compare-header">
        <div className="compare-header-left">
          <h1 className="compare-title">⚖️ Compare Clients</h1>
          <p className="compare-subtitle">Side-by-side analytics comparison</p>
        </div>
        {hasResults && (
          <button className="compare-clear-btn" onClick={clearComparison}>
            ✕ Clear Comparison
          </button>
        )}
      </div>

      {/* Selector Panel */}
      <div className="compare-selector-panel">
        <div className="compare-selector-row">
          <div className="compare-select-group">
            <label>Client A</label>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="compare-select"
              disabled={comparing}
            >
              <option value="">Select Client A...</option>
              {groupedClients.parents.length > 0 && (
                <optgroup label="── Groups (Parent + Subsidiaries) ──">
                  {groupedClients.parents.map(c => (
                    <option key={`gp-${c.id}`} value={c.id}>
                      🏢 {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="── All Clients ──">
                {clients.map(c => (
                  <option key={c.id} value={c.id} disabled={c.id === selectedB}>
                    {c.isSubsidiary ? '  └ ' : ''}{c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="compare-vs-badge" onClick={handleSwap} title="Swap clients">
            <span className="compare-vs-text">VS</span>
            <span className="compare-swap-icon">⇄</span>
          </div>

          <div className="compare-select-group">
            <label>Client B</label>
            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="compare-select"
              disabled={comparing}
            >
              <option value="">Select Client B...</option>
              {groupedClients.parents.length > 0 && (
                <optgroup label="── Groups (Parent + Subsidiaries) ──">
                  {groupedClients.parents.map(c => (
                    <option key={`gp-${c.id}`} value={c.id}>
                      🏢 {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="── All Clients ──">
                {clients.map(c => (
                  <option key={c.id} value={c.id} disabled={c.id === selectedA}>
                    {c.isSubsidiary ? '  └ ' : ''}{c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            className="compare-run-btn"
            onClick={handleCompare}
            disabled={!selectedA || !selectedB || selectedA === selectedB || comparing}
          >
            {comparing ? (
              <>
                <span className="compare-spinner" /> Comparing...
              </>
            ) : (
              <>📊 Compare</>
            )}
          </button>
        </div>
        {selectedA && selectedB && selectedA === selectedB && (
          <p className="compare-warning">⚠️ Please select two different clients</p>
        )}
      </div>

      {/* Loading State */}
      {comparing && (
        <div className="compare-loading">
          <div className="compare-loading-content">
            <div className="compare-loading-spinner" />
            <p>Loading comparison data...</p>
            <p className="compare-loading-sub">Fetching KPIs, categories & hospitals for both clients</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasResults && !comparing && (
        <div className="compare-empty">
          <div className="compare-empty-icon">⚖️</div>
          <h2>Select Two Clients to Compare</h2>
          <p>Choose Client A and Client B from the dropdowns above, then click Compare to see a detailed side-by-side analysis.</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="compare-results">
          {/* Client Name Headers */}
          <div className="compare-names-bar">
            <div className="compare-name-badge a">
              <span className="compare-name-letter">A</span>
              <span className="compare-name-text">{clientA.clientName}</span>
            </div>
            <div className="compare-name-badge b">
              <span className="compare-name-letter">B</span>
              <span className="compare-name-text">{clientB.clientName}</span>
            </div>
          </div>

          {/* KPI Comparison Table */}
          <div className="compare-section">
            <h2 className="compare-section-title">📊 Key Performance Indicators</h2>
            <div className="compare-kpi-table">
              <KPIRow label="Total Members" icon="👥" valueA={clientA.kpis.total_members} valueB={clientB.kpis.total_members} format="num" better="higher" />
              <KPIRow label="Total Claims" icon="📋" valueA={clientA.kpis.total_claims} valueB={clientB.kpis.total_claims} format="num" better="higher" />
              <KPIRow label="Total Approved" icon="💰" valueA={clientA.kpis.total_cost_usd} valueB={clientB.kpis.total_cost_usd} format="money" better="neutral" />
              <KPIRow label="Cost per Member" icon="💵" valueA={clientA.kpis.cost_per_member} valueB={clientB.kpis.cost_per_member} format="money2" better="lower" />
              <KPIRow label="Utilization Rate" icon="📈" valueA={clientA.kpis.utilization} valueB={clientB.kpis.utilization} format="pct" better="neutral" />
              <KPIRow label="Avg Claim Cost" icon="🏷️" valueA={clientA.kpis.avg_claim_cost} valueB={clientB.kpis.avg_claim_cost} format="money2" better="lower" />
              <KPIRow label="Enrollments" icon="➕" valueA={clientA.kpis.new_enrollments} valueB={clientB.kpis.new_enrollments} format="num" better="higher" />
              <KPIRow label="Cancellations" icon="➖" valueA={clientA.kpis.cancellations} valueB={clientB.kpis.cancellations} format="num" better="lower" />
            </div>
          </div>

          {/* Claim Types Side by Side */}
          <div className="compare-section">
            <h2 className="compare-section-title">🏥 Claim Types Breakdown</h2>
            <div className="compare-dual-grid">
              <ClaimTypesCard data={clientA} label="A" />
              <ClaimTypesCard data={clientB} label="B" />
            </div>
          </div>

          {/* Member Types Side by Side */}
          <div className="compare-section">
            <h2 className="compare-section-title">👥 Member Composition</h2>
            <div className="compare-dual-grid">
              <MemberTypesCard data={clientA} label="A" />
              <MemberTypesCard data={clientB} label="B" />
            </div>
          </div>

          {/* Categories Comparison */}
          {(clientA.categories.length > 0 || clientB.categories.length > 0) && (
            <div className="compare-section">
              <h2 className="compare-section-title">📂 Claims by Category</h2>
              <div className="compare-dual-grid">
                <CategoryCard data={clientA} />
                <CategoryCard data={clientB} />
              </div>
            </div>
          )}

          {/* Top Hospitals */}
          {(clientA.hospitals.length > 0 || clientB.hospitals.length > 0) && (
            <div className="compare-section">
              <h2 className="compare-section-title">🏥 Top Hospitals</h2>
              <div className="compare-dual-grid">
                <HospitalCard data={clientA} />
                <HospitalCard data={clientB} />
              </div>
            </div>
          )}

          {/* Summary Verdict */}
          <div className="compare-section">
            <h2 className="compare-section-title">📋 Quick Summary</h2>
            <SummaryVerdict clientA={clientA} clientB={clientB} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function KPIRow({ label, icon, valueA, valueB, format, better }: {
  label: string;
  icon: string;
  valueA: number;
  valueB: number;
  format: 'num' | 'money' | 'money2' | 'pct';
  better: 'higher' | 'lower' | 'neutral';
}) {
  const formatVal = (v: number) => {
    if (format === 'num') return fmtNum(Math.round(v));
    if (format === 'money') return fmt(Math.round(v));
    if (format === 'money2') return '$' + v.toFixed(2);
    if (format === 'pct') return v.toFixed(1) + '%';
    return v.toString();
  };

  const diff = pctDiff(valueA, valueB);
  const winner = better === 'neutral' ? 'tie' : winnerDot(valueA, valueB, better);

  return (
    <div className="kpi-row">
      <div className="kpi-row-label">
        <span className="kpi-row-icon">{icon}</span>
        {label}
      </div>
      <div className={`kpi-row-value a ${winner === 'A' ? 'winner' : ''}`}>
        {formatVal(valueA)}
        {winner === 'A' && <span className="winner-badge">✦</span>}
      </div>
      <div className={`kpi-row-diff ${diff.cls}`}>{diff.value}</div>
      <div className={`kpi-row-value b ${winner === 'B' ? 'winner' : ''}`}>
        {formatVal(valueB)}
        {winner === 'B' && <span className="winner-badge">✦</span>}
      </div>
    </div>
  );
}

function ClaimTypesCard({ data, label }: { data: CompareClientData; label: string }) {
  const total = data.kpis.inpatient_cases + data.kpis.outpatient_cases + data.kpis.exgratia_cases;
  const inPct = total > 0 ? (data.kpis.inpatient_cases / total * 100) : 0;
  const outPct = total > 0 ? (data.kpis.outpatient_cases / total * 100) : 0;
  const exPct = total > 0 ? (data.kpis.exgratia_cases / total * 100) : 0;

  return (
    <div className={`compare-card side-${label.toLowerCase()}`}>
      <div className="compare-card-header">{data.clientName}</div>
      <div className="compare-bars">
        <BarRow label="Inpatient" value={data.kpis.inpatient_cases} pct={inPct} cost={data.kpis.inpatient_cost} color="#e74c3c" />
        <BarRow label="Outpatient" value={data.kpis.outpatient_cases} pct={outPct} cost={data.kpis.outpatient_cost} color="#27ae60" />
        <BarRow label="Ex-Gratia" value={data.kpis.exgratia_cases} pct={exPct} cost={data.kpis.exgratia_cost} color="#f39c12" />
      </div>
    </div>
  );
}

function BarRow({ label, value, pct, cost, color }: { label: string; value: number; pct: number; cost: number; color: string }) {
  return (
    <div className="bar-row">
      <div className="bar-row-header">
        <span className="bar-row-label">{label}</span>
        <span className="bar-row-stats">{fmtNum(value)} cases • {fmt(cost)}</span>
      </div>
      <div className="bar-row-track">
        <div className="bar-row-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }}>
          {pct > 8 && <span className="bar-row-pct">{pct.toFixed(1)}%</span>}
        </div>
      </div>
    </div>
  );
}

function MemberTypesCard({ data, label }: { data: CompareClientData; label: string }) {
  const total = data.kpis.principal_members + data.kpis.dependent_members;
  const principalPct = total > 0 ? (data.kpis.principal_members / total * 100) : 0;
  const dependentPct = total > 0 ? (data.kpis.dependent_members / total * 100) : 0;

  return (
    <div className={`compare-card side-${label.toLowerCase()}`}>
      <div className="compare-card-header">{data.clientName}</div>
      <div className="member-composition">
        <div className="member-donut-row">
          <div className="member-stat">
            <div className="member-stat-dot" style={{ background: '#3498db' }} />
            <div className="member-stat-info">
              <span className="member-stat-label">Principal</span>
              <span className="member-stat-value">{fmtNum(data.kpis.principal_members)} ({principalPct.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="member-stat">
            <div className="member-stat-dot" style={{ background: '#9b59b6' }} />
            <div className="member-stat-info">
              <span className="member-stat-label">Dependent</span>
              <span className="member-stat-value">{fmtNum(data.kpis.dependent_members)} ({dependentPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
        <div className="member-bar-track">
          <div className="member-bar-fill principal" style={{ width: `${principalPct}%` }} />
          <div className="member-bar-fill dependent" style={{ width: `${dependentPct}%` }} />
        </div>
        <div className="member-movement">
          <span className="movement-item positive">➕ {fmtNum(data.kpis.new_enrollments)} enrolled</span>
          <span className="movement-item negative">➖ {fmtNum(data.kpis.cancellations)} cancelled</span>
          <span className={`movement-item ${data.kpis.new_enrollments - data.kpis.cancellations >= 0 ? 'positive' : 'negative'}`}>
            Net: {data.kpis.new_enrollments - data.kpis.cancellations >= 0 ? '+' : ''}{fmtNum(data.kpis.new_enrollments - data.kpis.cancellations)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ data }: { data: CompareClientData }) {
  const maxCost = Math.max(...data.categories.map(c => c.cost), 1);

  return (
    <div className="compare-card">
      <div className="compare-card-header">{data.clientName}</div>
      {data.categories.length === 0 ? (
        <div className="compare-card-empty">No category data available</div>
      ) : (
        <div className="category-list">
          {data.categories.slice(0, 6).map((cat, i) => (
            <div key={i} className="category-item">
              <div className="category-item-header">
                <span className="category-item-name">{cat.category}</span>
                <span className="category-item-stats">{fmtNum(cat.count)} • {fmt(cat.cost)}</span>
              </div>
              <div className="category-item-bar">
                <div
                  className="category-item-fill"
                  style={{ width: `${(cat.cost / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HospitalCard({ data }: { data: CompareClientData }) {
  return (
    <div className="compare-card">
      <div className="compare-card-header">{data.clientName}</div>
      {data.hospitals.length === 0 ? (
        <div className="compare-card-empty">No hospital data available</div>
      ) : (
        <div className="hospital-list">
          {data.hospitals.slice(0, 5).map((h, i) => (
            <div key={i} className="hospital-item">
              <span className="hospital-rank">#{i + 1}</span>
              <div className="hospital-info">
                <span className="hospital-name">{h.hospital}</span>
                <span className="hospital-stats">{fmtNum(h.claims)} claims • {fmt(h.cost)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryVerdict({ clientA, clientB }: { clientA: CompareClientData; clientB: CompareClientData }) {
  const metrics = [
    { label: 'Larger Member Base', winner: winnerDot(clientA.kpis.total_members, clientB.kpis.total_members), nameA: clientA.clientName, nameB: clientB.clientName },
    { label: 'More Claims Volume', winner: winnerDot(clientA.kpis.total_claims, clientB.kpis.total_claims), nameA: clientA.clientName, nameB: clientB.clientName },
    { label: 'Higher Approved Cost', winner: winnerDot(clientA.kpis.total_cost_usd, clientB.kpis.total_cost_usd), nameA: clientA.clientName, nameB: clientB.clientName },
    { label: 'Lower Cost/Member', winner: winnerDot(clientA.kpis.cost_per_member, clientB.kpis.cost_per_member, 'lower'), nameA: clientA.clientName, nameB: clientB.clientName },
    { label: 'Higher Utilization', winner: winnerDot(clientA.kpis.utilization, clientB.kpis.utilization), nameA: clientA.clientName, nameB: clientB.clientName },
    { label: 'Better Net Movement', winner: winnerDot(
      clientA.kpis.new_enrollments - clientA.kpis.cancellations,
      clientB.kpis.new_enrollments - clientB.kpis.cancellations
    ), nameA: clientA.clientName, nameB: clientB.clientName },
  ];

  const winsA = metrics.filter(m => m.winner === 'A').length;
  const winsB = metrics.filter(m => m.winner === 'B').length;

  return (
    <div className="summary-verdict">
      <div className="verdict-scores">
        <div className={`verdict-score ${winsA >= winsB ? 'leading' : ''}`}>
          <span className="verdict-count">{winsA}</span>
          <span className="verdict-label">{clientA.clientName}</span>
        </div>
        <div className="verdict-separator">—</div>
        <div className={`verdict-score ${winsB >= winsA ? 'leading' : ''}`}>
          <span className="verdict-count">{winsB}</span>
          <span className="verdict-label">{clientB.clientName}</span>
        </div>
      </div>
      <div className="verdict-details">
        {metrics.map((m, i) => (
          <div key={i} className="verdict-row">
            <span className={`verdict-dot ${m.winner === 'A' ? 'a' : m.winner === 'B' ? 'b' : 'tie'}`} />
            <span className="verdict-metric">{m.label}</span>
            <span className="verdict-winner">
              {m.winner === 'tie' ? 'Tie' : m.winner === 'A' ? m.nameA : m.nameB}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
