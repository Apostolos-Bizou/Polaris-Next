'use client';

import { useState, useMemo, useCallback } from 'react';

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

interface PlanSelection {
  planId: string;
  principals: number;
  dependents: number;
  selected: boolean;
}

interface Props {
  onClose: () => void;
  onSave: (offerData: any) => void;
  clients: { client_id: string; client_name: string; client_type: string; parent_client_id: string | null }[];
}

// ── Default Plans ────────────────────────────────────────────────────
const DEFAULT_PLANS: PlanDef[] = [
  { id: 'bronze', name: 'Bronze', icon: '🥉', color: '#8B4513', reg: 20, fund: [15, 14, 13, 12], dentalFee: 9.5, mbl: 30000 },
  { id: 'silver', name: 'Silver', icon: '🥈', color: '#6c757d', reg: 24, fund: [20, 18, 16, 14], dentalFee: 9.5, mbl: 40000 },
  { id: 'gold', name: 'Gold', icon: '🥇', color: '#d4a843', reg: 24, fund: [45, 42, 39, 36], dentalFee: 9.5, mbl: 80000 },
  { id: 'gold_plus', name: 'Gold+', icon: '🏅', color: '#b8860b', reg: 24, fund: [50, 47, 44, 41], dentalFee: 9.5, mbl: 100000 },
  { id: 'gold_plus_plus', name: 'Gold++', icon: '🌟', color: '#8b6914', reg: 28, fund: [55, 52, 49, 46], dentalFee: 9.5, mbl: 150000 },
  { id: 'platinum', name: 'Platinum', icon: '💎', color: '#5a6268', reg: 24, fund: [50, 47, 44, 41], dentalFee: 9.5, mbl: 180000 },
  { id: 'diamond', name: 'Diamond', icon: '💠', color: '#17a2b8', reg: 40, fund: [100, 95, 90, 85], dentalFee: 9.5, mbl: 360000 },
];

const TIERS = [
  { tier: 1, label: '1 - 500', sub: 'Standard', min: 1, max: 500 },
  { tier: 2, label: '501 - 750', sub: 'Tier 2', min: 501, max: 750 },
  { tier: 3, label: '751 - 1100', sub: 'Tier 3', min: 751, max: 1100 },
  { tier: 4, label: '1100+', sub: 'Enterprise', min: 1101, max: 9999 },
];

const DENTAL_FEE = 9.50;

const fmt = (n: number) => n.toLocaleString();
const fmtUSD = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ═══════════════════════════════════════════════════════════════════════
export default function CreateOfferForm({ onClose, onSave, clients }: Props) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTier, setSelectedTier] = useState(1);
  const [includeDental, setIncludeDental] = useState(false);
  const [validityDays, setValidityDays] = useState(30);
  const [notes, setNotes] = useState('');
  const [planSelections, setPlanSelections] = useState<Record<string, PlanSelection>>(
    Object.fromEntries(DEFAULT_PLANS.map(p => [p.id, { planId: p.id, principals: 0, dependents: 0, selected: false }]))
  );

  // ── Client info ──────────────────────────────────────────────────
  const selectedClient = clients.find(c => c.client_id === selectedClientId);

  // ── Toggle plan selection ────────────────────────────────────────
  const togglePlan = (planId: string) => {
    setPlanSelections(prev => ({
      ...prev,
      [planId]: { ...prev[planId], selected: !prev[planId].selected }
    }));
  };

  const updatePlanMembers = (planId: string, field: 'principals' | 'dependents', value: number) => {
    setPlanSelections(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: Math.max(0, value), selected: true }
    }));
  };

  // ── Calculations ─────────────────────────────────────────────────
  const calculations = useMemo(() => {
    const tierIndex = selectedTier - 1;
    let totalPrincipals = 0;
    let totalDependents = 0;
    let totalRegFees = 0;
    let totalFundDeposit = 0;
    const planItems: any[] = [];

    DEFAULT_PLANS.forEach(plan => {
      const sel = planSelections[plan.id];
      if (!sel?.selected || (sel.principals === 0 && sel.dependents === 0)) return;

      const prin = sel.principals;
      const dep = sel.dependents;
      const total = prin + dep;
      const fundPerMember = plan.fund[tierIndex] || plan.fund[0];
      const regFee = total * plan.reg;
      const fundDep = total * fundPerMember;

      totalPrincipals += prin;
      totalDependents += dep;
      totalRegFees += regFee;
      totalFundDeposit += fundDep;

      planItems.push({
        plan_name: plan.name,
        plan_id: plan.id,
        principals: prin,
        dependents: dep,
        total_members: total,
        reg_fee_per_member: plan.reg,
        fund_dep_per_member: fundPerMember,
        subtotal_reg: regFee,
        subtotal_fund: fundDep,
      });
    });

    const totalMembers = totalPrincipals + totalDependents;
    const dentalTotal = includeDental ? totalMembers * DENTAL_FEE : 0;
    const grandTotal = totalRegFees + totalFundDeposit + dentalTotal;

    return { totalPrincipals, totalDependents, totalMembers, totalRegFees, totalFundDeposit, dentalTotal, grandTotal, planItems };
  }, [planSelections, selectedTier, includeDental]);

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (calculations.planItems.length === 0) {
      alert('Please select at least one plan with members.');
      return;
    }

    const offerData = {
      client_id: selectedClientId,
      client_name: selectedClient?.client_name || 'Prospective Client',
      tier: selectedTier,
      includes_dental: includeDental,
      validity_days: validityDays,
      notes,
      items: calculations.planItems,
      total_principals: calculations.totalPrincipals,
      total_dependents: calculations.totalDependents,
      total_members: calculations.totalMembers,
      subtotal_reg_fees: calculations.totalRegFees,
      subtotal_fund_deposit: calculations.totalFundDeposit,
      subtotal_dental: calculations.dentalTotal,
      grand_total_usd: calculations.grandTotal,
    };

    onSave(offerData);
  };

  // ── Reset ────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedClientId('');
    setSelectedTier(1);
    setIncludeDental(false);
    setValidityDays(30);
    setNotes('');
    setPlanSelections(
      Object.fromEntries(DEFAULT_PLANS.map(p => [p.id, { planId: p.id, principals: 0, dependents: 0, selected: false }]))
    );
  };

  // ── Organize clients for dropdown ────────────────────────────────
  // Organize clients hierarchically for dropdown
  const organizedClients = useMemo(() => {
    const parents = clients.filter(c => c.client_type === 'parent').sort((a, b) => a.client_name.localeCompare(b.client_name));
    const result: { client_id: string; client_name: string; isChild: boolean; parentName?: string }[] = [];
    parents.forEach(p => {
      const subs = clients.filter(c => c.parent_client_id === p.client_id).sort((a, b) => a.client_name.localeCompare(b.client_name));
      result.push({ client_id: p.client_id, client_name: p.client_name, isChild: false });
      subs.forEach(s => result.push({ client_id: s.client_id, client_name: s.client_name, isChild: true, parentName: p.client_name }));
    });
    // Add any orphans
    const usedIds = new Set(result.map(r => r.client_id));
    clients.filter(c => !usedIds.has(c.client_id)).forEach(c => result.push({ client_id: c.client_id, client_name: c.client_name, isChild: false }));
    return result;
  }, [clients]);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">📋 Create New Offer</h2>
            <p className="modal-sub">Configure plans, members, and pricing</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* 1. Select Client */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-icon">👤</span>
              <h3>Select Client</h3>
            </div>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="client-select"
            >
              <option value="">-- Select a client --</option>
              {organizedClients.map(c => (
                <option key={c.client_id} value={c.client_id}>
                  {c.isChild ? '    └─ ' : '🏢 '}{c.client_name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Population Tier */}
          <div className="form-section tier-section">
            <div className="section-header">
              <span className="section-icon">👥</span>
              <h3>Population Tier</h3>
              <span className="tier-badge">
                Tier {selectedTier}: {TIERS[selectedTier - 1].label} members
              </span>
            </div>
            <div className="tier-grid">
              {TIERS.map(t => (
                <button
                  key={t.tier}
                  className={`tier-btn ${selectedTier === t.tier ? 'active' : ''}`}
                  onClick={() => setSelectedTier(t.tier)}
                >
                  <div className="tier-label">{t.label}</div>
                  <div className="tier-sub">{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Select Plans */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <h3>Select Health Plans</h3>
            </div>
            <div className="plans-grid">
              {DEFAULT_PLANS.map(plan => {
                const sel = planSelections[plan.id];
                const isSelected = sel?.selected;
                const fundPerMember = plan.fund[selectedTier - 1] || plan.fund[0];
                return (
                  <div
                    key={plan.id}
                    className={`plan-card ${isSelected ? 'selected' : ''}`}
                    style={{ borderColor: isSelected ? plan.color : undefined }}
                  >
                    <div className="plan-header" onClick={() => togglePlan(plan.id)} style={{ cursor: 'pointer' }}>
                      <span className="plan-icon">{plan.icon}</span>
                      <span className="plan-name" style={{ color: isSelected ? plan.color : undefined }}>{plan.name}</span>
                      <span className={`plan-check ${isSelected ? 'checked' : ''}`}>
                        {isSelected ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="plan-pricing">
                      <div className="price-item">
                        <span>Reg Fee</span>
                        <strong>${plan.reg}</strong>
                      </div>
                      <div className="price-item">
                        <span>Fund Dep</span>
                        <strong>${fundPerMember}</strong>
                      </div>
                      <div className="price-item">
                        <span>MBL</span>
                        <strong>${(plan.mbl / 1000).toFixed(0)}K</strong>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="plan-inputs">
                        <div className="input-group">
                          <label>Principals</label>
                          <input
                            type="number"
                            min="0"
                            value={sel.principals || ''}
                            onChange={(e) => updatePlanMembers(plan.id, 'principals', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="input-group">
                          <label>Dependents</label>
                          <input
                            type="number"
                            min="0"
                            value={sel.dependents || ''}
                            onChange={(e) => updatePlanMembers(plan.id, 'dependents', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Dental Benefits */}
          <div className="form-section dental-section">
            <label className="dental-toggle">
              <input
                type="checkbox"
                checked={includeDental}
                onChange={(e) => setIncludeDental(e.target.checked)}
              />
              <div className="dental-info">
                <h3>🦷 Dental Benefits Plan</h3>
                <p>Comprehensive dental coverage including prophylaxis, fillings, extractions, and consultations.</p>
              </div>
              <div className="dental-price">${DENTAL_FEE.toFixed(2)}<span>/member/year</span></div>
            </label>
          </div>

          {/* 5. Validity */}
          <div className="form-section validity-section">
            <span>📅 Offer Valid for</span>
            <input
              type="number"
              min="1"
              max="90"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
              className="validity-input"
            />
            <span>days</span>
            <span className="expiry-date">
              Expires: {new Date(Date.now() + validityDays * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* 6. Cost Summary */}
          <div className="cost-summary">
            <div className="cost-header">
              <h2>💰 Cost Summary</h2>
              <div className="members-badge">
                <span>{calculations.totalPrincipals}</span> Principals +{' '}
                <span>{calculations.totalDependents}</span> Dependents ={' '}
                <span className="total-members">{calculations.totalMembers}</span> Members
              </div>
            </div>

            {/* Plan breakdown */}
            {calculations.planItems.length > 0 && (
              <div className="plan-breakdown">
                {calculations.planItems.map((item, i) => (
                  <div key={i} className="breakdown-row">
                    <span className="breakdown-plan">{item.plan_name}</span>
                    <span>{item.principals}P + {item.dependents}D = {item.total_members}</span>
                    <span>Reg: {fmtUSD(item.subtotal_reg)}</span>
                    <span>Fund: {fmtUSD(item.subtotal_fund)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="cost-grid">
              <div className="cost-card">
                <div className="cost-label">Registration Fees</div>
                <div className="cost-value">{fmtUSD(calculations.totalRegFees)}</div>
              </div>
              <div className="cost-card">
                <div className="cost-label">Fund Deposits</div>
                <div className="cost-value">{fmtUSD(calculations.totalFundDeposit)}</div>
              </div>
              <div className="cost-card">
                <div className="cost-label">Dental Benefits</div>
                <div className="cost-value">{includeDental ? fmtUSD(calculations.dentalTotal) : '—'}</div>
              </div>
            </div>

            <div className="grand-total">
              <span>TOTAL ANNUAL COST</span>
              <span className="grand-value">{fmtUSD(calculations.grandTotal)}</span>
            </div>
          </div>

          {/* 7. Notes */}
          <div className="form-section">
            <textarea
              placeholder="Notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-input"
              rows={3}
            />
          </div>

          {/* 8. Action Buttons */}
          <div className="action-grid">
            <button className="action-btn reset" onClick={handleReset}>🔄 Reset</button>
            <button className="action-btn email" onClick={() => alert('Generate Email - coming soon')}>📧 Generate Email</button>
            <button className="action-btn doc" onClick={() => alert('Generate Document - coming soon')}>📄 Generate Doc</button>
            <button className="action-btn save" onClick={handleSave}>💾 Save Offer</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: #3d5a80; z-index: 1000;
          overflow-y: auto;
        }
        .modal-box {
          background: transparent;
          width: 100%; max-width: 1200px; margin: 0 auto;
          min-height: 100vh;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.5rem 2.5rem; border-bottom: 2px solid rgba(212,175,55,0.4);
          position: sticky; top: 0; background: rgba(61,90,128,0.97); z-index: 10;
          backdrop-filter: blur(10px);
        }
        .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 700; color: #D4AF37; }
        .modal-sub { color: rgba(255,255,255,0.7); font-size: 0.95rem; margin-top: 0.25rem; }
        .modal-close { background: rgba(231,76,60,0.2); border: 1px solid rgba(231,76,60,0.4); color: #EF5350; font-size: 1.5rem; cursor: pointer; padding: 0.4rem 0.8rem; border-radius: 8px; }
        .modal-close:hover { background: rgba(231,76,60,0.4); }
        .modal-body { padding: 2rem 2.5rem; }

        /* Form Sections */
        .form-section { margin-bottom: 1.5rem; background: rgba(10,22,40,0.85); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(45,80,112,0.3); }
        .section-header {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;
          padding-bottom: 0.5rem; border-bottom: 2px solid rgba(212,175,55,0.3);
        }
        .section-icon { font-size: 1.25rem; }
        .section-header h3 { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #ffffff; margin: 0; }

        /* Client Select */
        .client-select {
          width: 100%; padding: 0.85rem 1rem; font-size: 0.95rem;
          background: #0d1f2d; border: 2px solid rgba(45,80,112,0.4);
          border-radius: 10px; color: #ffffff; cursor: pointer; outline: none;
          font-family: inherit;
        }
        .client-select:focus { border-color: #D4AF37; }
        .client-select option { background: #0d1f2d; color: #ffffff; }

        /* Tier */
        .tier-section .tier-badge {
          margin-left: auto; background: rgba(212,175,55,0.15); color: #D4AF37;
          padding: 0.3rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 600;
        }
        .tier-grid { display: flex; gap: 0.5rem; }
        .tier-btn {
          flex: 1; padding: 0.85rem 0.5rem; border: 2px solid rgba(45,80,112,0.4);
          border-radius: 10px; background: #0d1f2d; cursor: pointer;
          text-align: center; transition: all 0.2s; color: #ffffff; font-family: inherit;
        }
        .tier-btn.active { background: #1e3a5f; border-color: #D4AF37; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
        .tier-btn:hover { border-color: rgba(45,80,112,0.5); }
        .tier-label { font-weight: 700; font-size: 1rem; }
        .tier-sub { font-size: 0.75rem; color: #7aa0c0; margin-top: 0.15rem; }

        /* Plans Grid */
        .plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .plan-card {
          border: 2px solid rgba(45,80,112,0.4); border-radius: 12px;
          overflow: hidden; transition: all 0.3s; background: #0d1f2d;
        }
        .plan-card.selected { background: #0d1f2d; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .plan-header {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 1rem 1rem; border-bottom: 1px solid rgba(45,80,112,0.2);
        }
        .plan-icon { font-size: 1.8rem; }
        .plan-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1.2rem; color: #ffffff; flex: 1; }
        .plan-check { font-size: 1.1rem; color: #5a6a7a; }
        .plan-check.checked { color: #4CAF50; }
        .plan-pricing {
          display: flex; gap: 0.5rem; padding: 0.75rem 1rem;
          font-size: 0.85rem; color: #7aa0c0;
        }
        .price-item { display: flex; flex-direction: column; flex: 1; }
        .price-item span { font-size: 0.8rem; color: #5a6a7a; }
        .price-item strong { color: #ffffff; font-size: 1.15rem; }
        .plan-inputs {
          display: flex; gap: 0.75rem; padding: 1rem 1rem;
          border-top: 1px solid rgba(45,80,112,0.2); background: rgba(212,175,55,0.05);
        }
        .input-group { flex: 1; }
        .input-group label { display: block; font-size: 0.8rem; color: #D4AF37; margin-bottom: 0.35rem; text-transform: uppercase; font-weight: 600; }
        .input-group input {
          width: 100%; padding: 0.75rem; background: #0a1628;
          border: 2px solid rgba(45,80,112,0.5); border-radius: 8px;
          color: #ffffff; font-size: 1.4rem; text-align: center; outline: none;
          font-family: 'Montserrat', sans-serif; font-weight: 700;
        }
        .input-group input:focus { border-color: #D4AF37; box-shadow: 0 0 0 3px rgba(212,175,55,0.2); }

        /* Dental */
        .dental-section { padding: 1.25rem 1.5rem; background: #0d1f2d; border-radius: 16px; border: 1px solid rgba(45,80,112,0.4); }
        .dental-toggle { display: flex; align-items: center; gap: 1rem; cursor: pointer; }
        .dental-toggle input { width: 20px; height: 20px; accent-color: #1e3a5f; cursor: pointer; }
        .dental-info { flex: 1; }
        .dental-info h3 { font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 700; color: #ffffff; margin: 0 0 0.25rem; }
        .dental-info p { color: #7aa0c0; font-size: 0.8rem; margin: 0; }
        .dental-price { font-size: 1.3rem; font-weight: 700; color: #ffffff; white-space: nowrap; }
        .dental-price span { font-size: 0.75rem; font-weight: 400; color: #7aa0c0; }

        /* Validity */
        .validity-section {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.85rem 1.25rem; background: #0d1f2d;
          border-radius: 12px; color: #ffffff; font-size: 0.9rem;
          border: 1px solid rgba(45,80,112,0.4);
        }
        .validity-input {
          width: 60px; padding: 0.5rem; background: #0a1628;
          border: 2px solid rgba(45,80,112,0.5); border-radius: 6px;
          color: #ffffff; font-size: 0.95rem; text-align: center; outline: none;
          font-family: inherit;
        }
        .expiry-date { margin-left: auto; color: #D4AF37; font-weight: 600; }

        /* Cost Summary */
        .cost-summary {
          background: linear-gradient(135deg, #1e3a5f, #2c4a6e);
          border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem; color: white;
        }
        .cost-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.2);
          flex-wrap: wrap; gap: 0.75rem;
        }
        .cost-header h2 { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; margin: 0; }
        .members-badge {
          background: #D4AF37; color: #1e3a5f; padding: 0.6rem 1.25rem;
          border-radius: 20px; font-weight: 700; font-size: 0.9rem;
        }
        .total-members { font-size: 1.2rem; }
        .plan-breakdown { margin-bottom: 1rem; }
        .breakdown-row {
          display: flex; gap: 1rem; padding: 0.4rem 0.75rem;
          background: rgba(255,255,255,0.05); border-radius: 6px;
          margin-bottom: 0.25rem; font-size: 0.85rem; align-items: center;
        }
        .breakdown-plan { font-weight: 700; min-width: 80px; }
        .cost-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
        .cost-card {
          background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; text-align: right;
        }
        .cost-label { font-size: 0.75rem; opacity: 0.8; text-transform: uppercase; margin-bottom: 0.4rem; }
        .cost-value { font-size: 2rem; font-weight: 700; font-family: 'Montserrat', sans-serif; }
        .grand-total {
          background: #D4AF37; color: #1e3a5f; padding: 1.25rem 1.5rem;
          border-radius: 10px; display: flex; justify-content: space-between; align-items: center;
        }
        .grand-total span:first-child { font-size: 1.2rem; font-weight: 700; }
        .grand-value { font-size: 2.5rem; font-weight: 800; font-family: 'Montserrat', sans-serif; }

        /* Notes */
        .notes-input {
          width: 100%; padding: 0.85rem; background: #0a1628;
          border: 2px solid rgba(45,80,112,0.5); border-radius: 10px;
          color: #ffffff; font-size: 0.9rem; resize: vertical; outline: none;
          font-family: inherit;
        }
        .notes-input:focus { border-color: #D4AF37; }

        /* Action Buttons */
        .action-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr 1fr; gap: 0.5rem; }
        .action-btn {
          padding: 0.85rem; border: none; border-radius: 10px;
          font-size: 0.9rem; font-weight: 600; cursor: pointer;
          transition: all 0.3s; font-family: inherit;
        }
        .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .action-btn.reset { background: #4a5568; color: white; }
        .action-btn.email { background: #D4AF37; color: #1e3a5f; }
        .action-btn.doc { background: #1e3a5f; color: white; }
        .action-btn.save { background: #28a745; color: white; }

        @media (max-width: 1024px) {
          .plans-grid { grid-template-columns: repeat(3, 1fr); }
          .tier-grid { flex-wrap: wrap; }
          .cost-grid { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr); }
          .modal-body { padding: 1.5rem; }
          .modal-header { padding: 1.25rem 1.5rem; }
          .grand-value { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .plans-grid { grid-template-columns: 1fr; }
          .action-grid { grid-template-columns: 1fr; }
          .modal-body { padding: 1rem; }
        }
      `}</style>
    </div>
  );
}
