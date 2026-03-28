'use client';

import { useState, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────────────
interface PlanDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  reg: number;
  fund: number[];
  dentalFee: number;
  mbl: number;
}

interface Props {
  onClose: () => void;
  onSave: (offerData: any) => void;
  clients: { client_id: string; client_name: string; client_type: string; parent_client_id: string | null }[];
}

// ── Default Plans ────────────────────────────────────────────────────
const PLANS: PlanDef[] = [
  { id: 'bronze', name: 'Bronze', icon: '🥉', color: '#8B4513', reg: 20, fund: [15, 14, 13, 12], dentalFee: 9.5, mbl: 30000 },
  { id: 'silver', name: 'Silver', icon: '🥈', color: '#6c757d', reg: 24, fund: [20, 18, 16, 14], dentalFee: 9.5, mbl: 40000 },
  { id: 'gold', name: 'Gold', icon: '🥇', color: '#d4a843', reg: 24, fund: [45, 42, 39, 36], dentalFee: 9.5, mbl: 80000 },
  { id: 'gold_plus', name: 'Gold+', icon: '🏅', color: '#b8860b', reg: 24, fund: [50, 47, 44, 41], dentalFee: 9.5, mbl: 100000 },
  { id: 'gold_plus_plus', name: 'Gold++', icon: '🌟', color: '#8b6914', reg: 28, fund: [55, 52, 49, 46], dentalFee: 9.5, mbl: 150000 },
  { id: 'platinum', name: 'Platinum', icon: '💎', color: '#5a6268', reg: 24, fund: [50, 47, 44, 41], dentalFee: 9.5, mbl: 180000 },
  { id: 'diamond', name: 'Diamond', icon: '💠', color: '#17a2b8', reg: 40, fund: [100, 95, 90, 85], dentalFee: 9.5, mbl: 360000 },
];

const PLAN_ORDER: Record<string, number> = { bronze: 1, silver: 2, gold: 3, gold_plus: 4, gold_plus_plus: 5, platinum: 6, diamond: 7 };

const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ═══════════════════════════════════════════════════════════════════════
export default function ComparisonQuoteForm({ onClose, onSave, clients }: Props) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [principals, setPrincipals] = useState(100);
  const [dependents, setDependents] = useState(500);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [dentalByPlan, setDentalByPlan] = useState<Record<string, boolean>>({});

  const totalMembers = principals + dependents;

  // Tier calculation
  const tier = totalMembers > 1100 ? 4 : totalMembers > 750 ? 3 : totalMembers > 500 ? 2 : 1;
  const tierIndex = tier - 1;
  const tierLabel = tier === 1 ? 'Tier 1' : tier === 2 ? 'Tier 2' : tier === 3 ? 'Tier 3' : 'Enterprise';

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const toggleDental = (planId: string) => {
    setDentalByPlan(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  // Sorted selected plans for preview
  const sortedSelected = useMemo(() =>
    [...selectedPlans].sort((a, b) => (PLAN_ORDER[a] || 99) - (PLAN_ORDER[b] || 99)),
    [selectedPlans]
  );

  // Calculate costs per plan
  const planCosts = useMemo(() => {
    return sortedSelected.map(planId => {
      const plan = PLANS.find(p => p.id === planId)!;
      const fundPerMember = plan.fund[tierIndex] || plan.fund[0];
      const regFee = principals * plan.reg;
      const fundDep = totalMembers * fundPerMember;
      const hasDental = dentalByPlan[planId] || false;
      const dental = hasDental ? totalMembers * plan.dentalFee : 0;
      const total = regFee + fundDep + dental;
      const perMember = totalMembers > 0 ? total / totalMembers : 0;
      return { plan, regFee, fundDep, dental, total, perMember, hasDental, fundPerMember };
    });
  }, [sortedSelected, principals, dependents, tierIndex, dentalByPlan, totalMembers]);

  // Parent clients for dropdown
  // Organize clients hierarchically for dropdown
  const organizedClients = useMemo(() => {
    const parents = clients.filter(c => c.client_type === 'parent').sort((a, b) => a.client_name.localeCompare(b.client_name));
    const result: { client_id: string; client_name: string; isChild: boolean }[] = [];
    parents.forEach(p => {
      const subs = clients.filter(c => c.parent_client_id === p.client_id).sort((a, b) => a.client_name.localeCompare(b.client_name));
      result.push({ client_id: p.client_id, client_name: p.client_name, isChild: false });
      subs.forEach(s => result.push({ client_id: s.client_id, client_name: s.client_name, isChild: true }));
    });
    const usedIds = new Set(result.map(r => r.client_id));
    clients.filter(c => !usedIds.has(c.client_id)).forEach(c => result.push({ client_id: c.client_id, client_name: c.client_name, isChild: false }));
    return result;
  }, [clients]);
  const selectedClient = clients.find(c => c.client_id === selectedClientId);

  // Save
  const handleSave = () => {
    if (sortedSelected.length < 2) {
      alert('Please select at least 2 plans to compare.');
      return;
    }
    const offerData = {
      offer_type: 'comparison',
      client_id: selectedClientId,
      client_name: selectedClient?.client_name || 'Prospective Client',
      total_principals: principals,
      total_dependents: dependents,
      total_members: totalMembers,
      includes_dental: Object.values(dentalByPlan).some(v => v),
      comparison_data: planCosts.map(pc => ({
        plan_name: pc.plan.name,
        plan_id: pc.plan.id,
        reg_fee: pc.regFee,
        fund_deposit: pc.fundDep,
        dental: pc.dental,
        total: pc.total,
        per_member: pc.perMember,
        has_dental: pc.hasDental,
      })),
      grand_total_usd: planCosts.length > 0 ? Math.max(...planCosts.map(p => p.total)) : 0,
      subtotal_reg_fees: planCosts.length > 0 ? planCosts[0].regFee : 0,
      subtotal_fund_deposit: planCosts.length > 0 ? planCosts[0].fundDep : 0,
      subtotal_dental: planCosts.reduce((sum, p) => sum + p.dental, 0) / (planCosts.length || 1),
    };
    onSave(offerData);
  };

  return (
    <div className="cq-overlay">
      <div className="cq-container">
        {/* Header */}
        <div className="cq-header">
          <div className="cq-header-left">
            <div className="cq-header-icon">📊</div>
            <div>
              <h1 className="cq-title">Comparison Quote Generator</h1>
              <p className="cq-subtitle">Compare multiple plan options side-by-side for your client</p>
            </div>
          </div>
          <button className="cq-close" onClick={onClose}>✕</button>
        </div>

        <div className="cq-body">
          {/* Step 1: Client & Population */}
          <div className="cq-step">
            <h3 className="step-title">📋 Step 1: Client & Population</h3>
            <div className="step1-grid">
              <div className="field">
                <label>Client Name</label>
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="field-select">
                  <option value="">-- Select Client --</option>
                  {organizedClients.map(c => (
                    <option key={c.client_id} value={c.client_id}>{c.isChild ? '    └─ ' : '🏢 '}{c.client_name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Principals (Seafarers)</label>
                <input type="number" value={principals} min={1} onChange={(e) => setPrincipals(parseInt(e.target.value) || 0)} className="field-input" />
              </div>
              <div className="field">
                <label>Dependents</label>
                <input type="number" value={dependents} min={0} onChange={(e) => setDependents(parseInt(e.target.value) || 0)} className="field-input" />
              </div>
            </div>
            <div className="members-banner">
              <span>Total Members: </span>
              <span className="members-count">{totalMembers.toLocaleString()}</span>
              <span className="tier-badge">{tierLabel}</span>
            </div>
          </div>

          {/* Step 2: Select Plans */}
          <div className="cq-step">
            <h3 className="step-title">📊 Step 2: Select Plans to Compare</h3>
            <div className="plans-row">
              {PLANS.map(plan => {
                const isSelected = selectedPlans.has(plan.id);
                const hasDental = dentalByPlan[plan.id] || false;
                const fundPerMember = plan.fund[tierIndex] || plan.fund[0];
                return (
                  <div
                    key={plan.id}
                    className={`cq-plan-card ${isSelected ? 'selected' : ''}`}
                    style={{ borderColor: isSelected ? plan.color : undefined }}
                  >
                    <div className="cq-plan-top" onClick={() => togglePlan(plan.id)}>
                      <span className="cq-plan-check" style={{ borderColor: isSelected ? plan.color : undefined, background: isSelected ? plan.color : undefined }}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="cq-plan-icon">{plan.icon}</span>
                      <span className="cq-plan-name" style={{ color: isSelected ? plan.color : '#ffffff' }}>{plan.name}</span>
                    </div>
                    <div className="cq-plan-info">
                      <div><span>Reg</span><strong>${plan.reg}</strong></div>
                      <div><span>Fund</span><strong>${fundPerMember}</strong></div>
                      <div><span>MBL</span><strong>${(plan.mbl / 1000).toFixed(0)}K</strong></div>
                    </div>
                    {isSelected && (
                      <label className="cq-dental-toggle">
                        <input type="checkbox" checked={hasDental} onChange={() => toggleDental(plan.id)} />
                        <span>🦷 + Dental ($9.50)</span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Preview */}
          <div className="cq-step preview-step">
            <h3 className="step-title preview-title">👁️ Preview: Side-by-Side Comparison</h3>

            {sortedSelected.length < 2 ? (
              <p className="preview-empty">Select at least 2 plans to see comparison</p>
            ) : (
              <>
                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th className="row-label-th">Cost Breakdown</th>
                        {planCosts.map(pc => (
                          <th key={pc.plan.id} style={{ color: pc.plan.color }}>
                            <div className="plan-col-header">
                              <span>{pc.plan.icon} {pc.plan.name}</span>
                              {pc.hasDental && <span className="dental-tag">+ Dental</span>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Registration Fee (Principals)</td>
                        {planCosts.map(pc => <td key={pc.plan.id}>{fmtUSD(pc.regFee)}</td>)}
                      </tr>
                      <tr>
                        <td>Fund Deposit (All Members)</td>
                        {planCosts.map(pc => <td key={pc.plan.id}>{fmtUSD(pc.fundDep)}</td>)}
                      </tr>
                      <tr>
                        <td>Dental Fee</td>
                        {planCosts.map(pc => <td key={pc.plan.id}>{pc.hasDental ? fmtUSD(pc.dental) : '—'}</td>)}
                      </tr>
                      <tr className="total-row">
                        <td>TOTAL COST</td>
                        {planCosts.map(pc => <td key={pc.plan.id} style={{ color: '#D4AF37' }}>{fmtUSD(pc.total)}</td>)}
                      </tr>
                      <tr className="per-member-row">
                        <td>Cost per Member</td>
                        {planCosts.map(pc => <td key={pc.plan.id}>${pc.perMember.toFixed(2)}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="preview-summary">
                  Population: {principals.toLocaleString()} Principals + {dependents.toLocaleString()} Dependents = <strong>{totalMembers.toLocaleString()} Members</strong>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="cq-actions">
            <button className="cq-btn reset" onClick={() => { setSelectedPlans(new Set()); setDentalByPlan({}); setPrincipals(100); setDependents(500); setSelectedClientId(''); }}>🔄 Reset</button>
            <button className="cq-btn email" onClick={() => alert('Generate Email - coming soon')}>✉️ Generate Offer Email</button>
            <button className="cq-btn doc" onClick={() => alert('Generate Document - coming soon')}>📄 Generate Offer Document</button>
            <button className="cq-btn save" onClick={handleSave}>💾 Save Offer</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cq-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: #3d5a80; z-index: 1000; overflow-y: auto;
        }
        .cq-container { max-width: 1300px; margin: 0 auto; min-height: 100vh; }

        /* Header */
        .cq-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 2.5rem;
          background: linear-gradient(135deg, #6d28d9, #8b5cf6);
          position: sticky; top: 0; z-index: 10;
        }
        .cq-header-left { display: flex; align-items: center; gap: 1rem; }
        .cq-header-icon {
          width: 48px; height: 48px; background: rgba(255,255,255,0.2);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
        }
        .cq-title { font-family: 'Montserrat', sans-serif; font-size: 1.4rem; font-weight: 700; color: #ffffff; margin: 0; }
        .cq-subtitle { font-size: 0.9rem; color: rgba(255,255,255,0.8); margin: 0.15rem 0 0; }
        .cq-close {
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
          color: white; font-size: 1.3rem; cursor: pointer; padding: 0.4rem 0.75rem;
          border-radius: 8px;
        }
        .cq-close:hover { background: rgba(255,255,255,0.3); }

        .cq-body { padding: 2rem 2.5rem; }

        /* Steps */
        .cq-step {
          margin-bottom: 1.5rem; padding: 1.5rem 1.75rem;
          background: #0d1f2d; border-radius: 16px;
          border: 2px solid rgba(139,92,246,0.3);
        }
        .step-title {
          font-family: 'Montserrat', sans-serif; font-size: 1.15rem;
          font-weight: 700; color: #a78bfa; margin: 0 0 1.25rem;
        }

        /* Step 1 fields */
        .step1-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
        .field label {
          display: block; font-size: 0.85rem; color: #7aa0c0;
          margin-bottom: 0.4rem; font-weight: 600;
        }
        .field-select, .field-input {
          width: 100%; padding: 0.85rem 1rem; background: #0a1628;
          border: 2px solid rgba(45,80,112,0.5); border-radius: 10px;
          color: #ffffff; font-size: 1.1rem; outline: none; font-family: inherit;
        }
        .field-input { text-align: center; font-size: 1.4rem; font-weight: 700; font-family: 'Montserrat', sans-serif; }
        .field-select:focus, .field-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        .field-select option { background: #0a1628; }
        .members-banner {
          margin-top: 1.25rem; padding: 1rem; background: rgba(139,92,246,0.1);
          border-radius: 10px; text-align: center; font-size: 1.1rem; color: #ffffff;
        }
        .members-count { font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0.25rem; }
        .tier-badge {
          margin-left: 0.75rem; background: #8b5cf6; color: white;
          padding: 0.3rem 0.85rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600;
        }

        /* Step 2: Plan cards */
        .plans-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.6rem; }
        .cq-plan-card {
          border: 2px solid rgba(45,80,112,0.4); border-radius: 12px;
          background: #0a1628; transition: all 0.3s; cursor: pointer; overflow: hidden;
        }
        .cq-plan-card.selected { box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .cq-plan-top {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 1rem 0.75rem;
        }
        .cq-plan-check {
          width: 24px; height: 24px; border: 2px solid rgba(45,80,112,0.5);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; color: white; flex-shrink: 0;
        }
        .cq-plan-icon { font-size: 1.5rem; }
        .cq-plan-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.05rem; }
        .cq-plan-info {
          display: flex; gap: 0.5rem; padding: 0.6rem 0.75rem;
          border-top: 1px solid rgba(45,80,112,0.2); font-size: 0.8rem;
        }
        .cq-plan-info div { flex: 1; }
        .cq-plan-info span { color: #5a6a7a; display: block; font-size: 0.7rem; }
        .cq-plan-info strong { color: #ffffff; font-size: 1rem; }
        .cq-dental-toggle {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 0.6rem; background: rgba(139,92,246,0.1);
          border-top: 1px solid rgba(139,92,246,0.2); cursor: pointer;
          font-size: 0.8rem; color: #a78bfa;
        }
        .cq-dental-toggle input { accent-color: #8b5cf6; width: 16px; height: 16px; }

        /* Step 3: Preview */
        .preview-step { background: #0a1628; border-color: rgba(212,175,55,0.3); }
        .preview-title { color: #D4AF37; }
        .preview-empty { text-align: center; color: rgba(255,255,255,0.5); font-size: 1.1rem; padding: 2rem 0; }
        .preview-table-wrap { overflow-x: auto; }
        .preview-table { width: 100%; border-collapse: collapse; color: white; }
        .preview-table thead tr { border-bottom: 2px solid #D4AF37; }
        .row-label-th {
          text-align: left; padding: 1.25rem; font-size: 1.05rem;
          color: #D4AF37; font-family: 'Montserrat', sans-serif;
        }
        .preview-table th {
          text-align: center; padding: 1.25rem 0.75rem;
          font-size: 1.2rem; min-width: 140px;
          font-family: 'Montserrat', sans-serif;
        }
        .plan-col-header { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .dental-tag { font-size: 0.75rem; opacity: 0.8; font-weight: 400; }
        .preview-table td {
          padding: 1rem 0.75rem; font-size: 1.1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .preview-table td:first-child { font-size: 1rem; }
        .preview-table td:not(:first-child) { text-align: center; font-weight: 500; }
        .total-row td {
          border-top: 2px solid #D4AF37; background: rgba(212,175,55,0.08);
          font-weight: 700; font-size: 1.5rem; padding: 1.25rem 0.75rem;
          font-family: 'Montserrat', sans-serif;
        }
        .total-row td:first-child { color: #D4AF37; font-size: 1.2rem; }
        .per-member-row td { background: rgba(255,255,255,0.03); font-size: 1.1rem; opacity: 0.85; }
        .preview-summary {
          margin-top: 1rem; padding: 0.85rem; background: rgba(255,255,255,0.05);
          border-radius: 8px; text-align: center; font-size: 0.95rem; color: rgba(255,255,255,0.7);
        }

        /* Actions */
        .cq-actions { display: grid; grid-template-columns: 1fr 2fr 2fr 1fr; gap: 0.75rem; }
        .cq-btn {
          padding: 1rem; border: none; border-radius: 12px;
          font-size: 0.95rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .cq-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .cq-btn.reset { background: #4a5568; color: white; }
        .cq-btn.email { background: linear-gradient(135deg, #D4AF37, #c49932); color: #1e3a5f; }
        .cq-btn.doc { background: linear-gradient(135deg, #1e3a5f, #2d5a87); color: white; }
        .cq-btn.save { background: linear-gradient(135deg, #28a745, #20c997); color: white; }

        @media (max-width: 1200px) { .plans-row { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 768px) {
          .step1-grid { grid-template-columns: 1fr; }
          .plans-row { grid-template-columns: repeat(3, 1fr); }
          .cq-actions { grid-template-columns: repeat(2, 1fr); }
          .cq-body { padding: 1.5rem; }
          .cq-header { padding: 1rem 1.5rem; }
        }
        @media (max-width: 480px) {
          .plans-row { grid-template-columns: repeat(2, 1fr); }
          .cq-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
