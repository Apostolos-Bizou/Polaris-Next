'use client';

import { useRenewals } from '@/hooks/use-renewals';
import './renewals.css';

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtCurrency = (n: number) => '$' + n.toLocaleString();

const NOTE_ICONS: Record<string, string> = {
  note: '📝', call: '📞', email: '📧', meeting: '🤝', followup: '🔔',
};

export default function RenewalsPage() {
  const r = useRenewals();

  if (r.loading) {
    return (
      <div className="rn-page">
        <div className="rn-loading"><div className="rn-spinner" />Loading renewals data...</div>
      </div>
    );
  }

  return (
    <div className="rn-page">
      {/* Header */}
      <div className="rn-header">
        <div>
          <h1 className="rn-title">📋 Follow Up Dashboard</h1>
          <p className="rn-subtitle">Contract renewals, pipeline management & follow-up queue</p>
        </div>
        <div className="rn-header-actions">
          <button className="rn-export-btn pdf">📄 Export PDF</button>
          <button className="rn-export-btn excel">📊 Export Excel</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="rn-kpis">
        <div className="rn-kpi members">
          <div className="rn-kpi-icon">👥</div>
          <div className="rn-kpi-value">{r.kpis.total_members.toLocaleString()}</div>
          <div className="rn-kpi-label">Total Members</div>
          <span className="rn-kpi-trend up">↗ Active Portfolio</span>
        </div>
        <div className="rn-kpi revenue">
          <div className="rn-kpi-icon">💰</div>
          <div className="rn-kpi-value">{fmtCurrency(r.kpis.annual_revenue)}</div>
          <div className="rn-kpi-label">Annual Revenue</div>
          <span className="rn-kpi-trend up">↗ +4.2% YoY</span>
        </div>
        <div className="rn-kpi pending">
          <div className="rn-kpi-icon">📋</div>
          <div className="rn-kpi-value">{r.kpis.pending_offers}</div>
          <div className="rn-kpi-label">Pending Offers</div>
          <span className="rn-kpi-trend neutral">In Pipeline</span>
        </div>
        <div className="rn-kpi expiring">
          <div className="rn-kpi-icon">⏰</div>
          <div className="rn-kpi-value">{r.kpis.expiring_contracts}</div>
          <div className="rn-kpi-label">Expiring (90 days)</div>
          <span className="rn-kpi-trend down">Action Required</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="rn-section-tabs">
        <button className={`rn-sec-tab ${r.activeSection === 'pipeline' ? 'active' : ''}`} onClick={() => r.setActiveSection('pipeline')}>
          📊 Offers Pipeline
        </button>
        <button className={`rn-sec-tab ${r.activeSection === 'expiring' ? 'active' : ''}`} onClick={() => r.setActiveSection('expiring')}>
          ⏰ Expiring Contracts
          {r.expiringCounts.d30 > 0 && <span className="rn-sec-badge critical">{r.expiringCounts.d30}</span>}
        </button>
        <button className={`rn-sec-tab ${r.activeSection === 'actions' ? 'active' : ''}`} onClick={() => r.setActiveSection('actions')}>
          🔔 Action Required
          {r.actionItems.length > 0 && <span className="rn-sec-badge">{r.actionItems.length}</span>}
        </button>
        <button className={`rn-sec-tab ${r.activeSection === 'notes' ? 'active' : ''}`} onClick={() => r.setActiveSection('notes')}>
          📝 Notes & Activity
        </button>
        <button className={`rn-sec-tab ${r.activeSection === 'calendar' ? 'active' : ''}`} onClick={() => r.setActiveSection('calendar')}>
          📅 Renewal Calendar
        </button>
      </div>

      {/* ═══ PIPELINE TAB ═══ */}
      {r.activeSection === 'pipeline' && (
        <div className="rn-section">
          {/* Kanban Pipeline with Refresh */}
          <div className="rn-section-header-row">
            <h3 className="rn-subsection-title">📊 Offers Pipeline</h3>
            <button className="rn-refresh-btn" onClick={r.refreshPipeline}>🔄 Refresh</button>
          </div>

          <div className="rn-pipeline-kanban">
            {(['draft', 'sent', 'followup1', 'followup2', 'followup3', 'accepted'] as const).map(stage => {
              const labels: Record<string, { label: string; icon: string; color: string }> = {
                draft: { label: 'Draft', icon: '📝', color: '#607D8B' },
                sent: { label: 'Sent', icon: '📤', color: '#2196F3' },
                followup1: { label: 'Follow-up 1', icon: '📞', color: '#9C27B0' },
                followup2: { label: 'Follow-up 2', icon: '📞', color: '#FF9800' },
                followup3: { label: 'Follow-up 3', icon: '🔥', color: '#F44336' },
                accepted: { label: 'Accepted', icon: '✅', color: '#4CAF50' },
              };
              const info = labels[stage];
              const offers = r.pipelineByStage[stage];
              return (
                <div key={stage} className={`rn-pipeline-col ${stage}`}>
                  <div className="rn-pipeline-col-header" style={{ background: `${info.color}30`, color: info.color }}>
                    {info.icon} {info.label} <span className="rn-pipeline-count">{offers.length}</span>
                  </div>
                  <div className="rn-pipeline-col-body">
                    {offers.length === 0 ? (
                      <div className="rn-pipeline-empty">No offers</div>
                    ) : (
                      offers.map(o => (
                        <a key={o.offer_id} href={`/clients/${o.client_id}`} className={`rn-pipeline-card ${o.urgency}`}>
                          <div className="rn-pc-client">{o.client_name}</div>
                          <div className="rn-pc-amount">{fmtCurrency(o.total_amount)}</div>
                          <div className="rn-pc-meta">
                            <span>{fmtDate(o.created_at)}</span>
                            <span className={`rn-pc-days ${o.urgency}`}>{o.days_since}d</span>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two columns: Pipeline bars + Action Required */}
          <div className="rn-two-col">
            {/* Left: Pipeline Distribution */}
            <div className="rn-pipeline-chart">
              <h3 className="rn-subsection-title">📊 Offers Pipeline</h3>
              <div className="rn-bars">
                {r.pipelineBars.map(bar => (
                  <div key={bar.key} className="rn-bar-row">
                    <span className="rn-bar-label">{bar.icon} {bar.label}</span>
                    <div className="rn-bar-track">
                      <div className="rn-bar-fill" style={{ width: `${bar.percentage}%`, background: bar.color }} />
                    </div>
                    <span className="rn-bar-count">{bar.count}</span>
                  </div>
                ))}
              </div>
              <div className="rn-pipeline-totals">
                <span>👥 {r.pipelineTotals.total_members.toLocaleString()} Members</span>
                <span>💰 {fmtCurrency(r.pipelineTotals.total_value)} Pipeline Value</span>
              </div>
            </div>

            {/* Right: Action Required - clickable tabs */}
            <div className="rn-action-side">
              <h3 className="rn-subsection-title">🔔 Action Required</h3>
              <div className="rn-action-mini-list">
                <button className="rn-action-mini-tab" onClick={() => { r.setActiveSection('actions'); }}>
                  <span className="rn-ami-icon" style={{ color: '#F44336' }}>⚠️</span>
                  <span className="rn-ami-label">Follow-up overdue</span>
                  <span className="rn-ami-count">{r.actionCounts.overdue}</span>
                </button>
                <button className="rn-action-mini-tab" onClick={() => { r.setActiveSection('actions'); }}>
                  <span className="rn-ami-icon" style={{ color: '#9C27B0' }}>📞</span>
                  <span className="rn-ami-label">Call today</span>
                  <span className="rn-ami-count">{r.actionCounts.call_today}</span>
                </button>
                <button className="rn-action-mini-tab" onClick={() => { r.setActiveSection('actions'); }}>
                  <span className="rn-ami-icon" style={{ color: '#FF9800' }}>⏰</span>
                  <span className="rn-ami-label">Contracts expiring</span>
                  <span className="rn-ami-count">{r.actionCounts.expiring}</span>
                </button>
                <button className="rn-action-mini-tab" onClick={() => { r.setActiveSection('actions'); }}>
                  <span className="rn-ami-icon" style={{ color: '#2196F3' }}>📤</span>
                  <span className="rn-ami-label">Send renewal</span>
                  <span className="rn-ami-count">{r.actionCounts.send_renewal}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed View Table with Print */}
          <div className="rn-detailed-view">
            <div className="rn-section-header-row">
              <h3 className="rn-subsection-title">📋 Detailed View</h3>
              <button className="rn-print-btn" onClick={() => window.print()}>🖨️ Print</button>
            </div>
            <div className="rn-table-wrap">
              <table className="rn-table">
                <thead>
                  <tr>
                    <th>Client</th><th>Stage</th><th>Members</th><th>Value</th><th>Last Activity</th><th>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pipeline.filter(o => o.status !== 'accepted').map(o => {
                    const stageLabels: Record<string, string> = {
                      draft: 'Draft', sent: 'Sent', followup1: 'Follow-1',
                      followup2: 'Follow-2', followup3: 'Follow-3',
                    };
                    const nextDays = o.status === 'draft' ? 7 : 3;
                    const nextDate = new Date(new Date(o.created_at).getTime() + nextDays * 86400000);
                    const noteIcon = o.status.includes('followup') ? '📞' : o.status === 'sent' ? '📧' : '📝';
                    return (
                      <tr key={o.offer_id}>
                        <td><a href={`/clients/${o.client_id}`} className="rn-client-link"><strong>{o.client_name}</strong></a></td>
                        <td><span className={`rn-stage-badge ${o.status}`}>{stageLabels[o.status] || o.status}</span></td>
                        <td style={{ textAlign: 'right' }}>{o.total_members.toLocaleString()}</td>
                        <td style={{ textAlign: 'right', color: '#D4AF37', fontWeight: 600 }}>{fmtCurrency(o.total_amount)}</td>
                        <td><span className="rn-last-note">{noteIcon} {fmtDate(o.created_at)}</span></td>
                        <td><span className="rn-next-action">{fmtDate(nextDate.toISOString())}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="rn-pipeline-totals">
              <span>👥 {r.pipelineTotals.total_members.toLocaleString()} Members</span>
              <span>💰 {fmtCurrency(r.pipelineTotals.total_value)} Pipeline Value</span>
              <span>📋 {r.pipelineTotals.active_offers} active offers</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXPIRING CONTRACTS TAB ═══ */}
      {r.activeSection === 'expiring' && (
        <div className="rn-section">
          <div className="rn-section-header-row">
            <h3 className="rn-subsection-title">⏰ Expiring Contracts</h3>
            <button
              className={`rn-active-filter ${r.showActiveOnly ? 'active' : ''}`}
              onClick={() => r.setShowActiveOnly(!r.showActiveOnly)}
            >
              Only In-use &amp; Active
            </button>
          </div>

          {/* Time filter tabs */}
          <div className="rn-expiring-tabs">
            {([30, 60, 90] as const).map(days => (
              <button
                key={days}
                className={`rn-exp-tab ${r.expiringFilter === days ? 'active' : ''}`}
                onClick={() => r.setExpiringFilter(days)}
              >
                {days} Days
                <span className="rn-exp-tab-count">
                  {days === 30 ? r.expiringCounts.d30 : days === 60 ? r.expiringCounts.d60 : r.expiringCounts.d90}
                </span>
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="rn-exp-summary">
            <div className="rn-exp-summary-card critical">
              <span className="rn-exp-sum-val">{r.expiringCounts.d30}</span>
              <span className="rn-exp-sum-label">≤30 days</span>
              <span className="rn-exp-sum-members">{r.expiringCounts.m30.toLocaleString()} 👥</span>
            </div>
            <div className="rn-exp-summary-card warning">
              <span className="rn-exp-sum-val">{r.expiringCounts.d60}</span>
              <span className="rn-exp-sum-label">≤60 days</span>
              <span className="rn-exp-sum-members">{r.expiringCounts.m60.toLocaleString()} 👥</span>
            </div>
            <div className="rn-exp-summary-card ok">
              <span className="rn-exp-sum-val">{r.expiringCounts.d90}</span>
              <span className="rn-exp-sum-label">≤90 days</span>
              <span className="rn-exp-sum-members">{r.expiringCounts.m90.toLocaleString()} 👥</span>
            </div>
          </div>

          {/* Expiring table - full width */}
          <div className="rn-table-wrap">
            <table className="rn-table expiring">
              <thead>
                <tr><th>Client</th><th>Contract</th><th>Members</th><th>Expiry</th><th>Days</th><th>Last Note</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {r.filteredExpiring.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#667788', padding: '2rem' }}>No contracts expiring in {r.expiringFilter} days</td></tr>
                ) : (
                  r.filteredExpiring.map(c => {
                    const lastNote = r.lastNoteByClient[c.client_id];
                    return (
                      <tr key={c.contract_id}>
                        <td><a href={`/clients/${c.client_id}`} className="rn-client-link"><strong>{c.client_name}</strong></a></td>
                        <td>{c.contract_type}</td>
                        <td style={{ textAlign: 'center' }}><span className="rn-member-badge">{c.member_count.toLocaleString()} 👥</span></td>
                        <td>{fmtDate(c.expiry_date)}</td>
                        <td><span className={`rn-days-badge ${c.urgency}`}>{c.days_until} days</span></td>
                        <td>
                          {lastNote ? (
                            <span className="rn-last-note-cell">
                              <span>{NOTE_ICONS[lastNote.type]}</span>
                              <span className="rn-ln-text">{lastNote.content.substring(0, 40)}{lastNote.content.length > 40 ? '...' : ''}</span>
                              <span className="rn-ln-date">{fmtDate(lastNote.created_at)}</span>
                            </span>
                          ) : (
                            <span className="rn-no-note">— No notes</span>
                          )}
                        </td>
                        <td>
                          <div className="rn-row-actions">
                            <a href="/offers" className="rn-renew-btn">🔄 Renew</a>
                            <a href="/email" className="rn-email-btn">📧 Email</a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ACTION REQUIRED TAB ═══ */}
      {r.activeSection === 'actions' && (
        <div className="rn-section">
          <div className="rn-action-summary">
            <div className="rn-action-sum-card overdue">
              <span className="rn-asc-icon">🔴</span>
              <span className="rn-asc-val">{r.actionCounts.overdue}</span>
              <span className="rn-asc-label">Follow-up Overdue</span>
            </div>
            <div className="rn-action-sum-card call">
              <span className="rn-asc-icon">📞</span>
              <span className="rn-asc-val">{r.actionCounts.call_today}</span>
              <span className="rn-asc-label">Call Today</span>
            </div>
            <div className="rn-action-sum-card expiring">
              <span className="rn-asc-icon">⏰</span>
              <span className="rn-asc-val">{r.actionCounts.expiring}</span>
              <span className="rn-asc-label">Contracts Expiring</span>
            </div>
            <div className="rn-action-sum-card send">
              <span className="rn-asc-icon">📤</span>
              <span className="rn-asc-val">{r.actionCounts.send_renewal}</span>
              <span className="rn-asc-label">Send Renewal</span>
            </div>
          </div>

          <div className="rn-action-list">
            {r.actionItems.length === 0 ? (
              <div className="rn-empty">✅ No pending actions — all caught up!</div>
            ) : (
              r.actionItems.map(item => (
                <div key={item.id} className={`rn-action-item ${item.type} ${item.urgency}`}>
                  <div className="rn-ai-left">
                    <span className="rn-ai-label">{item.label}</span>
                    <a href={`/clients/${item.client_id}`} className="rn-ai-client">{item.client_name}</a>
                    <span className="rn-ai-detail">{item.detail}</span>
                  </div>
                  <div className="rn-ai-right">
                    {item.type === 'call_today' && <a href="/email" className="rn-ai-btn call">📞 Call</a>}
                    {item.type === 'overdue' && <a href="/email" className="rn-ai-btn urgent">📧 Send Reminder</a>}
                    {item.type === 'expiring' && <a href="/offers" className="rn-ai-btn renew">🔄 Create Offer</a>}
                    {item.type === 'send_renewal' && <a href="/email" className="rn-ai-btn send">📤 Send Now</a>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ NOTES TAB ═══ */}
      {r.activeSection === 'notes' && (
        <div className="rn-section">
          <div className="rn-two-col">
            {/* Left: Add Note/Todo */}
            <div className="rn-notes-form-side">
              <div className="rn-note-form">
                <div className="rn-section-header-row">
                  <h3 className="rn-subsection-title">➕ Add Note / Todo</h3>
                  <a href="/email" className="rn-goto-email-compact">📧 Email Center →</a>
                </div>
                <div className="rn-qe-form">
                  <select className="rn-select" value={r.noteClient} onChange={e => r.setNoteClient(e.target.value)}>
                    <option value="">Select Client...</option>
                    {r.allClients.length > 0 ? (
                      r.allClients.map(c => (
                        <option key={c.id} value={`${c.id}|${c.name}`}>{c.isChild ? '└ ' : '🏢 '}{c.name}</option>
                      ))
                    ) : (
                      r.contracts.map(c => (
                        <option key={c.client_id} value={`${c.client_id}|${c.client_name}`}>🏢 {c.client_name}</option>
                      ))
                    )}
                  </select>

                  <div className="rn-qe-type-tags">
                    {(['note', 'call', 'email', 'meeting', 'followup'] as const).map(t => (
                      <button key={t} className={`rn-qe-tag ${r.noteType === t ? 'active' : ''}`} onClick={() => r.setNoteType(t)}>
                        {NOTE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="rn-textarea"
                    placeholder="Add your note, call summary, or follow-up details..."
                    value={r.noteContent}
                    onChange={e => r.setNoteContent(e.target.value)}
                    rows={4}
                  />

                  {/* Reminder */}
                  <div className="rn-reminder-row">
                    <span className="rn-reminder-label">⏰ Reminder:</span>
                    <input type="date" className="rn-reminder-input" value={r.noteReminderDate} onChange={e => r.setNoteReminderDate(e.target.value)} />
                    <input type="time" className="rn-reminder-input" value={r.noteReminderTime} onChange={e => r.setNoteReminderTime(e.target.value)} />
                  </div>

                  <div className="rn-qe-actions">
                    <button className="rn-qe-btn cancel" onClick={() => { r.setNoteClient(''); r.setNoteContent(''); r.setNoteType('note'); r.setNoteReminderDate(''); r.setNoteReminderTime(''); }}>Clear</button>
                    <button className="rn-qe-btn send" onClick={r.addNote} disabled={!r.noteClient || !r.noteContent.trim()}>
                      ➕ Add Note
                    </button>
                  </div>
                </div>
              </div>

              {/* Upcoming Reminders */}
              {r.upcomingReminders.length > 0 && (
                <div className="rn-reminders-box">
                  <h4 className="rn-subsection-title">⏰ Upcoming Reminders ({r.upcomingReminders.length})</h4>
                  {r.upcomingReminders.map(rem => (
                    <div key={rem.id} className={`rn-reminder-item ${rem.completed ? 'done' : ''}`}>
                      <button className="rn-todo-check" onClick={() => r.toggleNoteComplete(rem.id)}>
                        {rem.completed ? '✅' : '⬜'}
                      </button>
                      <div className="rn-reminder-info">
                        <span className="rn-reminder-client">{rem.client_name}</span>
                        <span className="rn-reminder-text">{rem.content.substring(0, 60)}{rem.content.length > 60 ? '...' : ''}</span>
                        <span className="rn-reminder-datetime">📅 {rem.reminder_date} {rem.reminder_time && `🕐 ${rem.reminder_time}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Recent Activity with search + filters */}
            <div className="rn-notes-list-side">
              <div className="rn-section-header-row">
                <h3 className="rn-subsection-title">📝 {r.showArchived ? 'Archived' : 'Active'} ({r.filteredNotes.length})</h3>
                <button className={`rn-archive-toggle ${r.showArchived ? 'active' : ''}`} onClick={() => r.setShowArchived(!r.showArchived)}>
                  {r.showArchived ? '📋 Show Active' : '📦 Show Archived'}
                </button>
              </div>

              <div className="rn-notes-search">
                <span className="rn-ns-icon">🔍</span>
                <input className="rn-ns-input" placeholder="Search notes..." value={r.noteSearch} onChange={e => r.setNoteSearch(e.target.value)} />
              </div>

              <div className="rn-notes-filters">
                {([
                  { key: 'all', label: 'All', icon: '📋' },
                  { key: 'note', label: 'Note', icon: '📝' },
                  { key: 'call', label: 'Call', icon: '📞' },
                  { key: 'email', label: 'Email', icon: '📧' },
                  { key: 'meeting', label: 'Meeting', icon: '🤝' },
                  { key: 'followup', label: 'Follow-up', icon: '🔔' },
                ] as const).map(f => (
                  <button key={f.key} className={`rn-nf-tab ${r.noteFilter === f.key ? 'active' : ''}`} onClick={() => r.setNoteFilter(f.key)}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>

              {r.filteredNotes.length === 0 ? (
                <div className="rn-empty">{r.noteSearch || r.noteFilter !== 'all' ? 'No notes matching filters.' : r.showArchived ? 'No archived notes.' : 'No notes yet.'}</div>
              ) : (
                r.filteredNotes.map(note => (
                  <div key={note.id} className={`rn-note-item ${note.type} ${note.completed ? 'completed' : ''}`}>
                    <button className="rn-todo-check" onClick={() => r.toggleNoteComplete(note.id)}>
                      {note.completed ? '✅' : '⬜'}
                    </button>
                    <div className="rn-note-content">
                      <div className="rn-note-header">
                        <a href={`/clients/${note.client_id}`} className="rn-note-client">{note.client_name}</a>
                        <span className={`rn-note-type-badge ${note.type}`}>{note.type}</span>
                        {note.reminder_date && <span className="rn-note-reminder-badge">⏰ {note.reminder_date}</span>}
                        <span className="rn-note-date">{fmtDate(note.created_at)}</span>
                      </div>
                      <p className={`rn-note-text ${note.completed ? 'strikethrough' : ''}`}>{note.content}</p>
                      <span className="rn-note-author">By {note.created_by}</span>
                    </div>
                    <div className="rn-note-actions-col">
                      {!r.showArchived && (
                        <button className="rn-note-archive" onClick={() => r.archiveNote(note.id)} title="Archive">📦</button>
                      )}
                      {r.showArchived && (
                        <button className="rn-note-archive" onClick={() => r.unarchiveNote(note.id)} title="Unarchive">↩️</button>
                      )}
                      <button className="rn-note-delete" onClick={() => r.deleteNote(note.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CALENDAR TAB ═══ */}
      {r.activeSection === 'calendar' && (
        <div className="rn-section">
          <h3 className="rn-subsection-title">📅 Renewal Calendar — 12 Month View</h3>
          <p className="rn-cal-subtitle">Contract expiration timeline across the year. Each bar represents a client&apos;s contract nearing expiry.</p>

          <div className="rn-calendar-grid">
            {r.calendarData.map(month => (
              <div key={`${month.year}-${month.month}`} className={`rn-cal-month ${month.isCurrentMonth ? 'current' : ''} ${month.contracts.length > 0 ? 'has-items' : ''}`}>
                <div className="rn-cal-month-header">
                  <span className="rn-cal-month-name">{month.label}</span>
                  <span className="rn-cal-month-year">{month.year}</span>
                  {month.contracts.length > 0 && (
                    <span className="rn-cal-month-count">{month.contracts.length}</span>
                  )}
                </div>
                <div className="rn-cal-month-body">
                  {month.contracts.length === 0 ? (
                    <div className="rn-cal-empty">—</div>
                  ) : (
                    month.contracts.map(c => {
                      const expDay = new Date(c.expiry_date).getDate();
                      return (
                        <a key={c.contract_id} href={`/clients/${c.client_id}`} className={`rn-cal-item ${c.urgency}`}>
                          <span className="rn-cal-day">{expDay}</span>
                          <span className="rn-cal-client-name">{c.client_name}</span>
                          <span className="rn-cal-members">{c.member_count} 👥</span>
                        </a>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className="rn-cal-summary">
            <span>📊 Total: {r.contracts.length} renewals across 12 months</span>
            <span>👥 {r.contracts.reduce((s, c) => s + c.member_count, 0).toLocaleString()} members</span>
          </div>
        </div>
      )}
    </div>
  );
}
