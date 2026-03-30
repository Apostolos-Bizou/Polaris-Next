'use client';

import { useReports } from '@/hooks/use-reports';
import './reports.css';

export default function ReportsPage() {
  const rp = useReports();

  return (
    <div className="rp-page">
      {/* Header */}
      <div className="rp-header">
        <div>
          <h1 className="rp-title">{'\uD83D\uDCCA'} Report Generator</h1>
          <p className="rp-subtitle">Create custom analytics reports for clients and management</p>
        </div>
        <div className="rp-header-actions">
          <button className="rp-action-btn gold" onClick={() => rp.setActiveTab('builder')}>
            {'\uD83D\uDCC4'} New Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rp-tabs">
        <button className={`rp-tab ${rp.activeTab === 'builder' ? 'active' : ''}`} onClick={() => rp.setActiveTab('builder')}>
          {'\uD83D\uDEE0\uFE0F'} Report Builder
        </button>
        <button className={`rp-tab ${rp.activeTab === 'history' ? 'active' : ''}`} onClick={() => rp.setActiveTab('history')}>
          {'\uD83D\uDCC1'} Report History <span className="rp-badge">{rp.history.length}</span>
        </button>
        <button className={`rp-tab ${rp.activeTab === 'scheduled' ? 'active' : ''}`} onClick={() => rp.setActiveTab('scheduled')}>
          {'\u23F0'} Scheduled Reports
        </button>
      </div>

      {/* ═══ REPORT BUILDER TAB ═══ */}
      {rp.activeTab === 'builder' && (
        <div className="rp-builder">
          {/* Row 1: Client + Period */}
          <div className="rp-top-row">
            <div className="rp-section">
              <div className="rp-section-title">{'\uD83C\uDFE2'} Client</div>
              <select className="rp-select" value={rp.selectedClient} onChange={e => rp.setSelectedClient(e.target.value)}>
                <option value="all">{'\uD83C\uDF10'} All Clients (Company-wide)</option>
                {rp.clients.map(c => (
                  <option key={c.id} value={c.id}>{c.isChild ? '  \u2514 ' : '\uD83C\uDFE2 '}{c.name}</option>
                ))}
              </select>
            </div>
            <div className="rp-section">
              <div className="rp-section-title">{'\uD83D\uDCC5'} Period</div>
              <div className="rp-period-grid">
                <div>
                  <label className="rp-label">From</label>
                  <select className="rp-select" value={rp.fromPeriod} onChange={e => rp.setFromPeriod(e.target.value)}>
                    <option value="2025-Q1">Q1 2025</option>
                    <option value="2025-Q2">Q2 2025</option>
                    <option value="2025-Q3">Q3 2025</option>
                    <option value="2025-Q4">Q4 2025</option>
                    <option value="2024-Q1">Q1 2024</option>
                    <option value="2024-Q2">Q2 2024</option>
                    <option value="2024-Q3">Q3 2024</option>
                    <option value="2024-Q4">Q4 2024</option>
                  </select>
                </div>
                <div>
                  <label className="rp-label">To</label>
                  <select className="rp-select" value={rp.toPeriod} onChange={e => rp.setToPeriod(e.target.value)}>
                    <option value="2025-Q1">Q1 2025</option>
                    <option value="2025-Q2">Q2 2025</option>
                    <option value="2025-Q3">Q3 2025</option>
                    <option value="2025-Q4">Q4 2025</option>
                    <option value="2024-Q1">Q1 2024</option>
                    <option value="2024-Q2">Q2 2024</option>
                    <option value="2024-Q3">Q3 2024</option>
                    <option value="2024-Q4">Q4 2024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="rp-section">
            <div className="rp-section-title">{'\u26A1'} Quick Templates</div>
            <div className="rp-templates">
              {rp.templates.map(t => (
                <button
                  key={t.key}
                  className={`rp-template-btn ${rp.activeTemplate === t.key ? 'active' : ''}`}
                  onClick={() => rp.selectTemplate(t.key)}
                >
                  <span className="rp-template-icon">{t.icon}</span>
                  <span className="rp-template-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Report Sections */}
          <div className="rp-section">
            <div className="rp-section-title-row">
              <span className="rp-section-title">{'\uD83D\uDCCB'} Report Sections</span>
              <div className="rp-section-actions">
                <button className="rp-mini-btn" onClick={rp.selectAllSections}>Select All</button>
                <button className="rp-mini-btn" onClick={rp.clearAllSections}>Clear All</button>
                <span className="rp-count">{rp.selectedCount} selected</span>
              </div>
            </div>
            <div className="rp-sections-list">
              {rp.sections.map(s => (
                <label key={s.key} className={`rp-section-item ${s.checked ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => rp.toggleSection(s.key)}
                  />
                  <div className="rp-section-item-content">
                    <div className="rp-section-item-title">{s.icon} {s.title}</div>
                    <div className="rp-section-item-desc">{s.desc}</div>
                  </div>
                  <span className="rp-section-item-badge">{s.pages}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Format */}
          <div className="rp-section">
            <div className="rp-section-title">{'\uD83C\uDFA8'} Export Format</div>
            <div className="rp-formats">
              {[
                { key: 'pdf' as const, icon: '\uD83D\uDCC4', label: 'PDF' },
                { key: 'excel' as const, icon: '\uD83D\uDCCA', label: 'Excel' },
                { key: 'both' as const, icon: '\uD83D\uDCE6', label: 'PDF + Excel' },
              ].map(f => (
                <button
                  key={f.key}
                  className={`rp-format-btn ${rp.format === f.key ? 'selected' : ''}`}
                  onClick={() => rp.setFormat(f.key)}
                >
                  <span className="rp-format-icon">{f.icon}</span>
                  <span className="rp-format-label">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="rp-info-box">
            <span>{'\uD83D\uDCA1'}</span>
            <div>
              <strong>Tip:</strong> Select only the sections you need for faster report generation.
              Estimated: <strong>~{rp.estimatedPages} pages</strong> with current selection.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="rp-footer">
            <div className="rp-footer-info">
              <span className="rp-footer-badge">{rp.selectedCount} sections</span>
              <span className="rp-footer-badge format">{rp.format.toUpperCase()}</span>
              <span className="rp-footer-badge period">{rp.fromPeriod}{rp.fromPeriod !== rp.toPeriod ? ` \u2192 ${rp.toPeriod}` : ''}</span>
            </div>
            <div className="rp-footer-actions">
              <button className="rp-btn preview" onClick={() => {
                const sel = rp.sections.filter(s => s.checked).map(s => s.title).join(', ');
                alert(`Report Preview\n\nPeriod: ${rp.fromPeriod} - ${rp.toPeriod}\nSections: ${sel}\nFormat: ${rp.format.toUpperCase()}\nEstimated Pages: ~${rp.estimatedPages}`);
              }}>
                {'\uD83D\uDD0D'} Preview
              </button>
              <button
                className="rp-btn generate"
                onClick={rp.generateReport}
                disabled={rp.selectedCount === 0 || rp.generating}
              >
                {rp.generating ? `Generating... ${rp.progress}%` : `${'\uD83D\uDCC4'} Generate Report`}
              </button>
            </div>
          </div>

          {/* Progress Bar (visible during generation) */}
          {rp.generating && (
            <div className="rp-progress-overlay">
              <div className="rp-progress-box">
                <div className="rp-progress-icon">{'\uD83D\uDCC4'}</div>
                <h3 className="rp-progress-title">Generating Report...</h3>
                <p className="rp-progress-step">{rp.progressStep}</p>
                <div className="rp-progress-bar-bg">
                  <div className="rp-progress-bar-fill" style={{ width: `${rp.progress}%` }} />
                </div>
                <p className="rp-progress-pct">{rp.progress}%</p>
              </div>
            </div>
          )}

          {/* Success message */}
          {!rp.generating && rp.progress === 100 && rp.progressStep && (
            <div className="rp-success-msg">
              {'\u2705'} {rp.progressStep}
            </div>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {rp.activeTab === 'history' && (
        <div className="rp-history">
          <div className="rp-history-header">
            <h2 className="rp-section-title">{'\uD83D\uDCC1'} Generated Reports</h2>
            <span className="rp-count">{rp.history.length} reports</span>
          </div>
          <table className="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Report</th>
                <th>Client</th>
                <th>Period</th>
                <th>Format</th>
                <th>Sections</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rp.history.map((r, i) => (
                <tr key={r.id}>
                  <td className="rp-row-num">{i + 1}</td>
                  <td>
                    <div className="rp-report-title">{r.title}</div>
                    <div className="rp-report-id">{r.id}</div>
                  </td>
                  <td>{r.client}</td>
                  <td>{r.period}</td>
                  <td>
                    <span className={`rp-format-tag ${r.format.includes('PDF') ? 'pdf' : 'excel'}`}>
                      {r.format}
                    </span>
                  </td>
                  <td className="rp-center">{r.sections}</td>
                  <td>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div className="rp-action-group">
                      <button className="rp-action-btn-sm download" title="Download">{'\uD83D\uDCE5'}</button>
                      <button className="rp-action-btn-sm email" title="Email">{'\uD83D\uDCE7'}</button>
                      <button className="rp-action-btn-sm delete" title="Delete">{'\uD83D\uDDD1\uFE0F'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ SCHEDULED TAB ═══ */}
      {rp.activeTab === 'scheduled' && (
        <div className="rp-scheduled">
          <div className="rp-empty-state">
            <div className="rp-empty-icon">{'\u23F0'}</div>
            <h3>No Scheduled Reports</h3>
            <p>Set up automatic report generation on a daily, weekly, or monthly basis.</p>
            <button className="rp-btn generate" onClick={() => alert('Scheduled reports coming soon!')}>
              {'\u2795'} Create Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
