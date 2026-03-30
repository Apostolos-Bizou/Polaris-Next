'use client';

import React from 'react';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEmailCenter } from '@/hooks/use-email';
import RichEditor from '@/components/email/rich-editor';
import InboxTab from '@/components/email/inbox-tab';
import '@/components/email/inbox.css';
import './email.css';

const CATEGORY_ICONS: Record<string, string> = {
  contract: '📄', client: '👥', finance: '💰', alert: '🚨', wishes: '🎉', other: '📧',
};

export default function EmailCenterPage() {
  const ec = useEmailCenter();
  const [editorHtml, setEditorHtml] = React.useState('');
  const [sendDocsAttachments, setSendDocsAttachments] = React.useState<Array<{type: string; name: string; key: string}>>([]);
  const searchParams = useSearchParams();

  // ═══ Send Documents Handoff ═══
  useEffect(() => {
    if (searchParams.get('sendDocs') === 'true') {
      try {
        const raw = localStorage.getItem('polaris_send_docs');
        if (raw) {
          const data = JSON.parse(raw);
          // Switch to Compose tab
          ec.setActiveTab('compose');

          // Auto-select contract template
          ec.handleTemplateChange('contract_01');

          // Build attachments list
          const atts: Array<{type: string; name: string; key: string}> = [];
          const docNames: Record<string, string> = {
            nda: '🔒 NDA', dpa: '🛡️ DPA', asa: '📋 ASA',
            proposal: '💼 Proposal', comparison_quote: '📊 Comparison Quote',
          };
          const progNames: Record<string, string> = {
            silver: '🥈 Silver Brochure', gold: '🥇 Gold Brochure',
            goldplus: '🥇+ Gold+ Brochure', goldplusplus: '🥇++ Gold++ Brochure',
            platinum: '💎 Platinum Brochure', diamond: '💠 Diamond Brochure',
            dental: '🦷 Dental Brochure',
          };

          if (data.docs) {
            data.docs.forEach((d: string) => {
              atts.push({ type: 'doc', name: docNames[d] || d, key: d });
            });
          }
          if (data.programs) {
            data.programs.forEach((p: string) => {
              atts.push({ type: 'brochure', name: progNames[p] || p, key: p });
            });
          }
          setSendDocsAttachments(atts);

          // Set subject with client name
          if (data.clientName) {
            ec.setSubject(`Contract Documents - ${data.clientName}`);
          }

          // Clean up
          localStorage.removeItem('polaris_send_docs');
          // Remove ?sendDocs from URL without reload
          window.history.replaceState({}, '', '/email');
        }
      } catch (e) {
        console.error('Send Docs handoff error:', e);
      }
    }
  }, [searchParams]);

  // Load history + scheduled when switching tabs
  useEffect(() => {
    if (ec.activeTab === 'history') ec.loadHistory();
    if (ec.activeTab === 'scheduler') ec.loadScheduledEmails();
  }, [ec.activeTab]);

  return (
    <div className="em-page">
      {/* Header */}
      <div className="em-header">
        <div>
          <h1 className="em-title">📧 Email Center</h1>
          <p className="em-subtitle">Compose, send & manage client communications</p>
        </div>
        <div className="em-header-actions">
          <button className="em-config-btn" onClick={() => ec.setShowConfig(!ec.showConfig)}>
            ⚙️ Email Settings
          </button>
          <div className={`em-connection-badge ${ec.emailConfig.connected ? 'connected' : 'disconnected'}`}>
            {ec.emailConfig.connected ? '🟢' : '🔴'} {ec.emailConfig.provider === 'polaris' ? 'Polaris SMTP' : ec.emailConfig.provider.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Email Config Panel */}
      {ec.showConfig && (
        <div className="em-config-panel">
          <h3 className="em-config-title">⚙️ Email Connection Settings</h3>
          <p className="em-config-desc">Connect your company email to send from your own address</p>
          <div className="em-config-grid">
            <div className="em-config-group">
              <label>Provider</label>
              <select
                value={ec.emailConfig.provider}
                onChange={e => ec.updateEmailConfig({ provider: e.target.value as any })}
                className="em-select"
              >
                <option value="polaris">Polaris Default (Built-in)</option>
                <option value="smtp">Custom SMTP</option>
                <option value="gmail">Gmail / Google Workspace</option>
                <option value="outlook">Outlook / Microsoft 365</option>
              </select>
            </div>
            {ec.emailConfig.provider !== 'polaris' && (
              <>
                <div className="em-config-group">
                  <label>From Name</label>
                  <input className="em-input" value={ec.emailConfig.from_name || ''} onChange={e => ec.updateEmailConfig({ from_name: e.target.value })} placeholder="Your Company Name" />
                </div>
                <div className="em-config-group">
                  <label>From Email</label>
                  <input className="em-input" value={ec.emailConfig.from_email || ''} onChange={e => ec.updateEmailConfig({ from_email: e.target.value })} placeholder="you@company.com" />
                </div>
                {ec.emailConfig.provider === 'smtp' && (
                  <>
                    <div className="em-config-group">
                      <label>SMTP Host</label>
                      <input className="em-input" value={ec.emailConfig.smtp_host || ''} onChange={e => ec.updateEmailConfig({ smtp_host: e.target.value })} placeholder="smtp.company.com" />
                    </div>
                    <div className="em-config-group">
                      <label>SMTP Port</label>
                      <input className="em-input" type="number" value={ec.emailConfig.smtp_port || 587} onChange={e => ec.updateEmailConfig({ smtp_port: parseInt(e.target.value) })} />
                    </div>
                    <div className="em-config-group">
                      <label>Username</label>
                      <input className="em-input" value={ec.emailConfig.smtp_user || ''} onChange={e => ec.updateEmailConfig({ smtp_user: e.target.value })} placeholder="username" />
                    </div>
                    <div className="em-config-group">
                      <label>Password</label>
                      <input className="em-input" type="password" value={ec.emailConfig.smtp_pass || ''} onChange={e => ec.updateEmailConfig({ smtp_pass: e.target.value })} placeholder="••••••••" />
                    </div>
                  </>
                )}
                {(ec.emailConfig.provider === 'gmail' || ec.emailConfig.provider === 'outlook') && (
                  <div className="em-config-group full">
                    <div className="em-oauth-box">
                      <p>Click below to authorize {ec.emailConfig.provider === 'gmail' ? 'Google' : 'Microsoft'} access:</p>
                      <button className="em-oauth-btn" onClick={ec.testConnection}>
                        🔗 Connect {ec.emailConfig.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {ec.emailConfig.provider === 'smtp' && (
            <button className="em-test-btn" onClick={ec.testConnection}>🔌 Test Connection</button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="em-tabs">
        <button className={`em-tab inbox ${ec.activeTab === 'inbox' as any ? 'active' : ''}`} onClick={() => ec.setActiveTab('inbox' as any)}>📥 Inbox</button>
        <button className={`em-tab ${ec.activeTab === 'compose' ? 'active' : ''}`} onClick={() => ec.setActiveTab('compose')}>✉️ Compose</button>
        <button className={`em-tab ${ec.activeTab === 'templates' ? 'active' : ''}`} onClick={() => ec.setActiveTab('templates')}>📝 Templates</button>
        <button className={`em-tab ${ec.activeTab === 'history' ? 'active' : ''}`} onClick={() => ec.setActiveTab('history')}>📋 History</button>
        <button className={`em-tab bulk ${ec.activeTab === 'bulk' ? 'active' : ''}`} onClick={() => ec.setActiveTab('bulk')}>🚀 Bulk Send</button>
        <button className={`em-tab scheduler ${ec.activeTab === 'scheduler' ? 'active' : ''}`} onClick={() => ec.setActiveTab('scheduler')}>⏰ Scheduler</button>
      </div>

      {/* ═══ INBOX TAB ═══ */}
      {ec.activeTab === ('inbox' as any) && (
        <InboxTab />
      )}

      {/* ═══ COMPOSE TAB ═══ */}
      {ec.activeTab === 'compose' && (
        <div className="em-tab-content">
          <div className="em-form-group">
            <label>📝 Select Template</label>
            <select className="em-select" value={ec.selectedTemplate} onChange={e => ec.handleTemplateChange(e.target.value)}>
              <option value="">-- Select a template --</option>
              <optgroup label="📄 Contract">
                {ec.templates.filter(t => t.category === 'contract').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="👥 Client Communication">
                {ec.templates.filter(t => t.category === 'client').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="💰 Financial">
                {ec.templates.filter(t => t.category === 'finance').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="🚨 Alerts">
                {ec.templates.filter(t => t.category === 'alert').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="🎉 Wishes">
                {ec.templates.filter(t => t.category === 'wishes').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="em-form-group">
            <label>🏢 Select Client</label>
            <select className="em-select" value={ec.selectedClient} onChange={e => ec.handleClientChange(e.target.value)}>
              <option value="">-- Select a client --</option>
              {ec.clients.map(c => (
                <option key={c.id} value={c.id}>{c.isChild ? '  └ ' : '🏢 '}{c.name}</option>
              ))}
            </select>
          </div>

          <div className="em-form-group">
            <label>👥 Recipients</label>
            <div className="em-recipients-box">
              {ec.recipients.length === 0 ? (
                <p className="em-empty-text">Select a client to see available contacts</p>
              ) : (
                ec.recipients.map(r => (
                  <label key={r.email} className="em-recipient-row">
                    <input type="checkbox" checked={r.selected} onChange={() => ec.toggleRecipient(r.email)} />
                    <span className="em-recipient-name">{r.name}</span>
                    <span className="em-recipient-email">{r.email}</span>
                    <span className="em-recipient-role">{r.role}</span>
                  </label>
                ))
              )}
            </div>
            {ec.recipients.length > 0 && (
              <div className="em-actions-row">
                <button className="em-action-btn" onClick={ec.selectAllRecipients}>☑️ Select All</button>
                <button className="em-action-btn primary-btn" onClick={() => ec.recipients.forEach(r => { if (r.role === 'Primary' || r.role === 'CREW MANAGER') ec.toggleRecipient(r.email); })}>👤 Primary Only</button>
                <button className="em-action-btn finance-btn" onClick={() => ec.recipients.forEach(r => { if (r.role === 'Finance') ec.toggleRecipient(r.email); })}>💰 Finance</button>
                <button className="em-action-btn ops-btn" onClick={() => ec.recipients.forEach(r => { if (r.role === 'Operations') ec.toggleRecipient(r.email); })}>⚙️ Operations</button>
                <button className="em-action-btn" onClick={ec.clearAllRecipients}>✖️ Clear All</button>
                <span className="em-count">{ec.recipients.filter(r => r.selected).length} selected</span>
              </div>
            )}
          </div>

          <div className="em-form-group">
            <label>📌 Subject</label>
            <input className="em-input" value={ec.subject} onChange={e => ec.setSubject(e.target.value)} placeholder="Email subject..." />
          </div>

          <div className="em-form-group">
            <label>➕ Additional Email (optional)</label>
            <div className="em-add-email-row">
              <input className="em-input" value={ec.additionalEmail} onChange={e => ec.setAdditionalEmail(e.target.value)} placeholder="additional@email.com" />
              <button className="em-action-btn" onClick={ec.addRecipient}>Add</button>
            </div>
          </div>

          {/* ═══ ATTACHMENTS FROM SEND DOCUMENTS ═══ */}
          {sendDocsAttachments.length > 0 && (
            <div className="em-form-group">
              <label>📎 Attached Documents ({sendDocsAttachments.length})</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8, padding: 12,
                background: 'rgba(10,22,40,0.5)',
                border: '1px solid rgba(45,80,112,0.4)',
                borderRadius: 10,
              }}>
                {sendDocsAttachments.map((att, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    background: att.type === 'doc'
                      ? 'rgba(76,175,80,0.1)' : 'rgba(33,150,243,0.1)',
                    border: `1px solid ${att.type === 'doc'
                      ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)'}`,
                    borderRadius: 8, fontSize: '0.85rem', color: '#e0e8f0',
                  }}>
                    <span>{att.name}</span>
                    <button onClick={() => setSendDocsAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      style={{
                        marginLeft: 'auto', background: 'rgba(231,76,60,0.2)',
                        border: 'none', color: '#ef5350', borderRadius: 4,
                        cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem',
                      }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#7aa0c0' }}>
                📨 Documents from Send Documents modal • Files will be attached from Google Drive
              </div>
            </div>
          )}

          <div className="em-form-group">
            <label>📝 Message Editor</label>
            <RichEditor
              value={editorHtml || ec.previewText.replace(/\n/g, '<br/>')}
              onChange={setEditorHtml}
              placeholder="Select a template or start typing your email..."
            />
          </div>

          {ec.sendStatus && (
            <div className={`em-status ${ec.sendStatus.type}`}>
              {ec.sendStatus.type === 'success' ? '✅' : '❌'} {ec.sendStatus.message}
            </div>
          )}

          <div className="em-btn-row">
            <button className="em-btn send" onClick={ec.sendEmail} disabled={!ec.canSend}>
              {ec.sending ? '📤 Sending...' : '📤 Send Email'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ TEMPLATES TAB ═══ */}
      {ec.activeTab === 'templates' && (
        <div className="em-tab-content">
          <div className="em-form-group">
            <label>🔍 Filter by Category</label>
            <select className="em-select" value={ec.templateFilter} onChange={e => ec.setTemplateFilter(e.target.value)}>
              <option value="all">All Templates</option>
              <option value="contract">📄 Contract</option>
              <option value="client">👥 Client</option>
              <option value="finance">💰 Financial</option>
              <option value="alert">🚨 Alerts</option>
              <option value="wishes">🎉 Wishes</option>
            </select>
          </div>
          <div className="em-templates-grid">
            {ec.filteredTemplates.map(t => (
              <div key={t.template_id} className="em-template-card" onClick={() => { ec.handleTemplateChange(t.template_id); ec.setActiveTab('compose'); }}>
                <div className="em-template-icon">{CATEGORY_ICONS[t.category] || '📧'}</div>
                <div className="em-template-info">
                  <div className="em-template-name">{t.template_name}</div>
                  <div className="em-template-subject">{t.subject}</div>
                </div>
                <span className="em-template-badge">{t.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {ec.activeTab === 'history' && (
        <div className="em-tab-content">
          {ec.historyLoading ? (
            <div className="em-loading">Loading email history...</div>
          ) : ec.history.length === 0 ? (
            <div className="em-empty-state">
              <div className="em-empty-icon">📋</div>
              <p>No email history found</p>
              <p className="em-empty-sub">Emails you send will appear here</p>
            </div>
          ) : (
            <div className="em-table-wrap">
              <table className="em-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Client</th><th>Subject</th><th>Recipients</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ec.history.map(h => (
                    <tr key={h.id}>
                      <td>{h.date}</td>
                      <td>{h.client}</td>
                      <td>{h.subject}</td>
                      <td>{h.recipients}</td>
                      <td><span className={`em-status-badge ${h.status}`}>{h.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ BULK SEND TAB ═══ */}
      {ec.activeTab === 'bulk' && (
        <div className="em-tab-content">
          <div className="em-bulk-warning">
            <h3>🚀 Bulk Send — Send to ALL Clients</h3>
            <p>Send the same email to all selected clients with one click!</p>
          </div>

          <div className="em-form-group">
            <label>📝 Select Template</label>
            <select className="em-select" value={ec.bulkTemplate} onChange={e => ec.setBulkTemplate(e.target.value)}>
              <option value="">-- Select a template --</option>
              <optgroup label="🎉 Wishes (Recommended for Bulk)">
                {ec.templates.filter(t => t.category === 'wishes').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="📄 Contract">
                {ec.templates.filter(t => t.category === 'contract').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
              <optgroup label="👥 Client / 💰 Financial">
                {ec.templates.filter(t => t.category === 'client' || t.category === 'finance').map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.template_name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="em-form-group">
            <label>👥 Recipients Role</label>
            <select className="em-select" value={ec.bulkRole} onChange={e => ec.setBulkRole(e.target.value)}>
              <option value="Primary">Primary Contacts Only (1 per client)</option>
              <option value="All">All Contacts</option>
              <option value="Finance">Finance Contacts Only</option>
              <option value="Operations">Operations Contacts Only</option>
            </select>
          </div>

          <div className="em-form-group">
            <label>🏢 Select Clients</label>
            <div className="em-recipients-box" style={{ maxHeight: '200px' }}>
              {ec.clients.filter(c => !c.isChild).map(c => (
                <label key={c.id} className="em-recipient-row">
                  <input type="checkbox" checked={!!ec.bulkClients[c.id]} onChange={() => ec.toggleBulkClient(c.id)} />
                  <span className="em-recipient-name">🏢 {c.name}</span>
                  <span className="em-recipient-email">{c.contact_email}</span>
                </label>
              ))}
            </div>
            <div className="em-actions-row">
              <button className="em-action-btn" onClick={ec.selectAllBulkClients}>☑️ Select All</button>
              <button className="em-action-btn" onClick={ec.clearAllBulkClients}>✖️ Clear All</button>
              <span className="em-count">{ec.bulkSelectedCount} clients selected</span>
            </div>
          </div>

          {/* Bulk Preview */}
          {ec.bulkTemplate && (
            <div className="em-form-group">
              <label>📝 Email Preview</label>
              <div className="em-preview-box">
                <pre className="em-preview-text">{(() => {
                  const tmpl = ec.templates.find(t => t.template_id === ec.bulkTemplate);
                  if (!tmpl) return 'Select a template to see preview';
                  const previews: Record<string, string> = {
                    'contract_01': 'Dear {{contact_name}},\n\nPlease find attached your Polaris Health Insurance Contract documents for {{client_name}}.\n\nKindly review and sign at your earliest convenience.\n\nBest regards,\nPolaris Financial Services',
                    'welcome_01': 'Dear {{contact_name}},\n\nWelcome to Polaris Financial Services! We are delighted to have {{client_name}} as our valued client.\n\nYour dedicated account manager will contact you shortly.\n\nBest regards,\nPolaris Team',
                    'meeting_01': 'Dear {{contact_name}},\n\nThank you for taking the time to meet with us regarding {{client_name}}.\n\nWe will prepare a detailed proposal and follow up shortly.\n\nBest regards,\nPolaris Team',
                    'renewal_01': 'Dear {{contact_name}},\n\nThis is a friendly reminder that the health insurance contract for {{client_name}} is approaching its renewal date.\n\nPlease contact us to discuss renewal terms.\n\nBest regards,\nPolaris Financial Services',
                    'balance_01': 'Dear {{contact_name}},\n\n{{client_name}} has an outstanding balance on the account.\n\nKindly arrange payment at your earliest convenience.\n\nBest regards,\nPolaris Accounts Team',
                    'revolving_01': 'Dear {{contact_name}},\n\nURGENT: The revolving fund for {{client_name}} has fallen below 50%.\n\nImmediate replenishment is required.\n\nBest regards,\nPolaris Financial Services',
                    'wishes_01': "Dear {{contact_name}},\n\nSeason's Greetings from the Polaris team!\n\nWe wish you and everyone at {{client_name}} a wonderful holiday season.\n\nWarm regards,\nPolaris Financial Services",
                    'wishes_02': 'Dear {{contact_name}},\n\nHappy Easter from Polaris Financial Services!\n\nWe wish you and the team at {{client_name}} a joyful celebration.\n\nBest wishes,\nPolaris Team',
                    'wishes_03': 'Dear {{contact_name}},\n\nHappy Birthday! The Polaris team wishes you a wonderful day.\n\nBest wishes,\nPolaris Financial Services',
                  };
                  return previews[ec.bulkTemplate] || tmpl.body || 'Dear {{contact_name}},\n\nThank you for your partnership with Polaris.\n\nBest regards,\nPolaris Team';
                })()}</pre>
                <p style={{color: '#8899aa', fontSize: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid rgba(136,153,170,0.15)', paddingTop: '0.5rem'}}>
                  ℹ️ {"{{client_name}}"} and {"{{contact_name}}"} will be replaced with each client{"'"}s details automatically.
                </p>
              </div>
            </div>
          )}

          <div className="em-bulk-notice">
            ⚠️ <strong>Warning:</strong> {ec.bulkSelectedCount} emails will be sent. Each email will be personalized for each client.
          </div>

          {ec.bulkStatus && (
            <div className={`em-status ${ec.bulkStatus.type}`}>
              {ec.bulkStatus.type === 'success' ? '✅' : '❌'} {ec.bulkStatus.message}
            </div>
          )}

          <div className="em-btn-row">
            <button className="em-btn bulk-send" onClick={ec.sendBulkEmail} disabled={!ec.canBulkSend}>
              {ec.bulkSending ? '🚀 Sending...' : `🚀 Send to ${ec.bulkSelectedCount} Clients`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ SCHEDULER TAB ═══ */}
      {ec.activeTab === 'scheduler' && (
        <div className="em-tab-content">
          <div className="em-scheduler-header">
            <h3>⏰ Email Scheduler</h3>
            <p>Schedule emails for a specific date and time</p>
          </div>

          <div className="em-schedule-form">
            <h4>➕ New Scheduled Email</h4>
            <div className="em-schedule-grid">
              <div className="em-form-group">
                <label>📝 Template</label>
                <select className="em-select" value={ec.scheduleTemplate} onChange={e => ec.setScheduleTemplate(e.target.value)}>
                  <option value="">-- Select template --</option>
                  {ec.templates.map(t => (
                    <option key={t.template_id} value={t.template_id}>{CATEGORY_ICONS[t.category]} {t.template_name}</option>
                  ))}
                </select>
              </div>
              <div className="em-form-group">
                <label>🏢 Client</label>
                <select className="em-select" value={ec.scheduleClient} onChange={e => ec.setScheduleClient(e.target.value)}>
                  <option value="">-- Select client --</option>
                  <option value="ALL">📢 ALL CLIENTS</option>
                  {ec.clients.filter(c => !c.isChild).map(c => (
                    <option key={c.id} value={c.id}>🏢 {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="em-form-group">
                <label>📅 Date</label>
                <input type="date" className="em-input" value={ec.scheduleDate} onChange={e => ec.setScheduleDate(e.target.value)} />
              </div>
              <div className="em-form-group">
                <label>🕐 Time</label>
                <input type="time" className="em-input" value={ec.scheduleTime} onChange={e => ec.setScheduleTime(e.target.value)} />
              </div>
              <div className="em-form-group full">
                <label>📝 Notes (optional)</label>
                <input className="em-input" value={ec.scheduleNotes} onChange={e => ec.setScheduleNotes(e.target.value)} placeholder="Add a note..." />
              </div>
            </div>
            <div className="em-btn-row" style={{ justifyContent: 'flex-end' }}>
              <button className="em-btn schedule" onClick={ec.addScheduledEmail} disabled={!ec.scheduleTemplate || !ec.scheduleClient || !ec.scheduleDate}>
                ➕ Schedule Email
              </button>
            </div>
          </div>

          <div className="em-scheduled-list">
            <div className="em-scheduled-header">
              <h4>📋 Scheduled Emails</h4>
              <button className="em-action-btn" onClick={ec.loadScheduledEmails}>🔄 Refresh</button>
            </div>
            {ec.scheduledEmails.length === 0 ? (
              <div className="em-empty-state small">
                <p>No scheduled emails</p>
              </div>
            ) : (
              <div className="em-table-wrap">
                <table className="em-table">
                  <thead>
                    <tr>
                      <th>📅 Date/Time</th><th>🏢 Client</th><th>📝 Template</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ec.scheduledEmails.map(s => (
                      <tr key={s.id}>
                        <td>{s.date} {s.time}</td>
                        <td>{s.client}</td>
                        <td>{s.template}</td>
                        <td><span className={`em-status-badge ${s.status}`}>{s.status}</span></td>
                        <td>
                          <button className="em-delete-btn" onClick={() => ec.deleteScheduledEmail(s.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
