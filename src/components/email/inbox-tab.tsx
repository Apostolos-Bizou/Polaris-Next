'use client';

import { useRef } from 'react';
import { useInbox } from '@/hooks/use-inbox';
import RichEditor from '@/components/email/rich-editor';

const fmtDate = (d: string) => {
  try {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch { return d; }
};

const fmtFullDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
};

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getFileIcon = (type: string, name: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️';
  if (type.includes('spreadsheet') || name.match(/\.xlsx?$/i)) return '📊';
  if (type.includes('word') || name.match(/\.docx?$/i)) return '📝';
  if (type.includes('zip') || name.match(/\.(zip|rar|7z)$/i)) return '📦';
  return '📎';
};

// ─── Email Chip Component ────────────────────────────────────────
function EmailChip({ email, onRemove }: { email: string; onRemove: () => void }) {
  return (
    <span className="ib-email-chip">
      {email}
      <button className="ib-chip-remove" onClick={onRemove}>×</button>
    </span>
  );
}

// ─── Email Input with chips ──────────────────────────────────────
function EmailChipInput({
  label,
  chips,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  label: string;
  chips: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && inputValue.trim()) {
      e.preventDefault();
      onAdd(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      onRemove(chips[chips.length - 1]);
    }
  };

  return (
    <div className="ib-chip-input-row">
      <span className="ib-chip-label">{label}</span>
      <div className="ib-chip-input-area">
        {chips.map(c => (
          <EmailChip key={c} email={c} onRemove={() => onRemove(c)} />
        ))}
        <input
          className="ib-chip-input"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) onAdd(inputValue); }}
          placeholder={chips.length === 0 ? 'Add email address...' : ''}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// INBOX TAB
// ═══════════════════════════════════════════════════════════════════
export default function InboxTab() {
  const inbox = useInbox();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fwdFileInputRef = useRef<HTMLInputElement>(null);

  if (inbox.loading) {
    return <div className="ib-loading"><div className="ib-spinner" />Loading inbox...</div>;
  }

  // ═══ FORWARD VIEW ═══
  if (inbox.view === 'forward' && inbox.selectedEmail) {
    const email = inbox.selectedEmail;
    return (
      <div className="ib-thread-view">
        <div className="ib-thread-header">
          <button className="ib-back-btn" onClick={inbox.cancelForward}>← Back to Email</button>
          <h3 style={{ color: '#D4AF37', margin: 0, fontSize: '0.95rem' }}>↗️ Forward Email</h3>
        </div>

        <div className="ib-forward-form">
          {/* To */}
          <div className="ib-fwd-field">
            <span className="ib-fwd-label">To:</span>
            <input
              className="ib-fwd-input"
              value={inbox.forwardTo}
              onChange={e => inbox.setForwardTo(e.target.value)}
              placeholder="Enter recipient email..."
            />
            <div className="ib-fwd-toggle-btns">
              <button className="ib-cc-toggle" onClick={() => {}}>CC</button>
              <button className="ib-cc-toggle" onClick={() => {}}>BCC</button>
            </div>
          </div>

          {/* Subject (read-only) */}
          <div className="ib-fwd-field">
            <span className="ib-fwd-label">Subject:</span>
            <span className="ib-fwd-subject">Fwd: {email.subject.replace(/^Fwd:\s*/i, '')}</span>
          </div>

          {/* Original attachments carried over */}
          {email.attachments.length > 0 && (
            <div className="ib-fwd-attachments-carried">
              <span className="ib-fwd-att-label">📎 Original attachments (will be forwarded):</span>
              <div className="ib-fwd-att-list">
                {email.attachments.map((a) => (
                  <span key={a.id} className="ib-fwd-att-chip">
                    {getFileIcon(a.type, a.name)} {a.name} ({fmtSize(a.size)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional attachments */}
          <div className="ib-reply-attachments-area">
            <input
              type="file"
              ref={fwdFileInputRef}
              multiple
              style={{ display: 'none' }}
              onChange={e => inbox.addForwardAttachment(e.target.files)}
            />
            <button className="ib-attach-btn" onClick={() => fwdFileInputRef.current?.click()}>
              📎 Add Attachment
            </button>
            {inbox.forwardAttachments.length > 0 && (
              <div className="ib-attached-files">
                {inbox.forwardAttachments.map((f, i) => (
                  <span key={i} className="ib-attached-file">
                    {getFileIcon(f.type, f.name)} {f.name} ({fmtSize(f.size)})
                    <button className="ib-chip-remove" onClick={() => inbox.removeForwardAttachment(i)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Forward body */}
          <div className="ib-fwd-body">
            <textarea
              className="ib-fwd-textarea"
              value={inbox.forwardText}
              onChange={e => inbox.setForwardText(e.target.value)}
              rows={12}
            />
          </div>

          <div className="ib-fwd-actions">
            <button className="ib-fwd-cancel" onClick={inbox.cancelForward}>Cancel</button>
            <button
              className="ib-fwd-send"
              onClick={inbox.sendForward}
              disabled={!inbox.forwardTo.trim() || inbox.forwarding}
            >
              {inbox.forwarding ? '📤 Sending...' : '↗️ Forward'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ THREAD VIEW ═══
  if (inbox.view === 'thread' && inbox.selectedEmail) {
    const email = inbox.selectedEmail;
    return (
      <div className="ib-thread-view">
        {/* Thread Header */}
        <div className="ib-thread-header">
          <button className="ib-back-btn" onClick={inbox.closeEmail}>← Back to Inbox</button>
          <div className="ib-thread-actions">
            <button className="ib-icon-btn" onClick={() => inbox.toggleStar(email.id)} title="Star">
              {email.starred ? '⭐' : '☆'}
            </button>
            <button className="ib-icon-btn" onClick={() => inbox.markAsAnswered(email.id)} title="Mark Answered">
              {email.answered ? '✅' : '⬜'}
            </button>
            <button className="ib-icon-btn" onClick={() => inbox.markAsUnread(email.id)} title="Mark Unread">📩</button>
            <button
              className="ib-icon-btn delete"
              onClick={() => inbox.setDeleteConfirm(email.id)}
              title="Delete"
            >🗑️</button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {inbox.deleteConfirm === email.id && (
          <div className="ib-delete-confirm">
            <span>Move this email to Trash?</span>
            <button className="ib-delete-yes" onClick={() => inbox.deleteEmail(email.id)}>Yes, Delete</button>
            <button className="ib-delete-no" onClick={() => inbox.setDeleteConfirm(null)}>Cancel</button>
          </div>
        )}

        {/* Subject */}
        <h2 className="ib-thread-subject">{email.subject}</h2>

        {/* Client Badge */}
        {email.matched_client_name && (
          <a href={`/clients/${email.matched_client_id}`} className="ib-client-badge">
            🏢 {email.matched_client_name} → Open Client Folder
          </a>
        )}

        {/* Original Email */}
        <div className="ib-thread-email">
          <div className="ib-thread-meta">
            <div className="ib-thread-sender">
              <div className="ib-avatar">{email.from_name.charAt(0)}</div>
              <div>
                <div className="ib-sender-name">{email.from_name}</div>
                <div className="ib-sender-email">{email.from}</div>
                {email.cc.length > 0 && (
                  <div className="ib-meta-cc">CC: {email.cc.join(', ')}</div>
                )}
              </div>
            </div>
            <div className="ib-thread-date">{fmtFullDate(email.date)}</div>
          </div>
          <div className="ib-thread-body" dangerouslySetInnerHTML={{ __html: email.body_html }} />

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="ib-attachments">
              <div className="ib-attachments-title">📎 Attachments ({email.attachments.length})</div>
              <div className="ib-attachments-grid">
                {email.attachments.map((a) => (
                  <div key={a.id} className="ib-attachment-card">
                    <span className="ib-att-icon">{getFileIcon(a.type, a.name)}</span>
                    <div className="ib-att-info">
                      <span className="ib-att-name">{a.name}</span>
                      <span className="ib-att-size">{fmtSize(a.size)}</span>
                    </div>
                    <button className="ib-att-download" title="Download">⬇️</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="ib-thread-status">
            <span className={`ib-status-tag ${email.answered ? 'answered' : 'pending'}`}>
              {email.answered ? '✅ Answered' : '⏳ Pending Reply'}
            </span>
          </div>
        </div>

        {/* Thread Replies (previous replies in thread) */}
        {email.replies && email.replies.length > 0 && (
          <div className="ib-thread-replies">
            <div className="ib-thread-replies-title">
              💬 Thread ({email.replies.length} {email.replies.length === 1 ? 'reply' : 'replies'})
            </div>
            {email.replies.map(reply => (
              <div key={reply.id} className="ib-thread-email reply-email">
                <div className="ib-thread-meta">
                  <div className="ib-thread-sender">
                    <div className="ib-avatar reply-avatar">{reply.from_name.charAt(0)}</div>
                    <div>
                      <div className="ib-sender-name">{reply.from_name}</div>
                      <div className="ib-sender-email">{reply.from}</div>
                      {reply.cc && reply.cc.length > 0 && (
                        <div className="ib-meta-cc">CC: {reply.cc.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <div className="ib-thread-date">{fmtFullDate(reply.date)}</div>
                </div>
                <div className="ib-thread-body" dangerouslySetInnerHTML={{ __html: reply.body_html || reply.body.replace(/\n/g, '<br/>') }} />
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="ib-attachments">
                    <div className="ib-attachments-title">📎 Attachments</div>
                    <div className="ib-attachments-grid">
                      {reply.attachments.map((a) => (
                        <div key={a.id} className="ib-attachment-card">
                          <span className="ib-att-icon">{getFileIcon(a.type, a.name)}</span>
                          <div className="ib-att-info">
                            <span className="ib-att-name">{a.name}</span>
                            <span className="ib-att-size">{fmtSize(a.size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ Reply Section ═══ */}
        <div className="ib-reply-section">
          {/* Reply mode buttons */}
          <div className="ib-reply-mode-bar">
            <button
              className={`ib-reply-mode-btn ${inbox.replyMode === 'reply' ? 'active' : ''}`}
              onClick={() => inbox.startReply('reply')}
            >
              ↩️ Reply
            </button>
            <button
              className={`ib-reply-mode-btn ${inbox.replyMode === 'reply-all' ? 'active' : ''}`}
              onClick={() => inbox.startReply('reply-all')}
            >
              ↩️↩️ Reply All
            </button>
            <button
              className="ib-reply-mode-btn forward"
              onClick={() => inbox.startReply('forward')}
            >
              ↗️ Forward
            </button>
            <div className="ib-reply-mode-spacer" />
            <button className="ib-cc-toggle-btn" onClick={() => inbox.setShowCC(!inbox.showCC)}>
              {inbox.showCC ? '− CC' : '+ CC'}
            </button>
            <button className="ib-cc-toggle-btn" onClick={() => inbox.setShowBCC(!inbox.showBCC)}>
              {inbox.showBCC ? '− BCC' : '+ BCC'}
            </button>
          </div>

          {/* Reply header */}
          <div className="ib-reply-header">
            <span className="ib-reply-to-label">To:</span>
            <span className="ib-reply-to-email">{email.from} ({email.from_name})</span>
          </div>

          {/* CC field */}
          {inbox.showCC && (
            <EmailChipInput
              label="CC:"
              chips={inbox.replyCC}
              inputValue={inbox.ccInput}
              onInputChange={inbox.setCcInput}
              onAdd={inbox.addCC}
              onRemove={inbox.removeCC}
            />
          )}

          {/* BCC field */}
          {inbox.showBCC && (
            <EmailChipInput
              label="BCC:"
              chips={inbox.replyBCC}
              inputValue={inbox.bccInput}
              onInputChange={inbox.setBccInput}
              onAdd={inbox.addBCC}
              onRemove={inbox.removeBCC}
            />
          )}

          {/* Rich text editor */}
          <RichEditor
            value={inbox.replyText}
            onChange={inbox.setReplyText}
            placeholder="Type your reply..."
          />

          {/* Quoted original (read-only display below editor) */}
          <div className="ib-quoted-original" dangerouslySetInnerHTML={{ __html: inbox.quotedOriginal }} />

          {/* Attachments */}
          <div className="ib-reply-attachments-area">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              style={{ display: 'none' }}
              onChange={e => inbox.addReplyAttachment(e.target.files)}
            />
            <button className="ib-attach-btn" onClick={() => fileInputRef.current?.click()}>
              📎 Attach File
            </button>
            {inbox.replyAttachments.length > 0 && (
              <div className="ib-attached-files">
                {inbox.replyAttachments.map((f, i) => (
                  <span key={i} className="ib-attached-file">
                    {getFileIcon(f.type, f.name)} {f.name} ({fmtSize(f.size)})
                    <button className="ib-chip-remove" onClick={() => inbox.removeReplyAttachment(i)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Send */}
          <div className="ib-reply-actions">
            <span className="ib-reply-summary">
              {inbox.replyMode === 'reply-all' && inbox.replyCC.length > 0
                ? `↩️ Reply All (${1 + inbox.replyCC.length} recipients)`
                : '↩️ Reply'}
              {inbox.replyBCC.length > 0 && ` + ${inbox.replyBCC.length} BCC`}
              {inbox.replyAttachments.length > 0 && ` + ${inbox.replyAttachments.length} attachment${inbox.replyAttachments.length > 1 ? 's' : ''}`}
            </span>
            <button
              className="ib-reply-send"
              onClick={inbox.sendReply}
              disabled={!inbox.replyText.trim() || inbox.replying}
            >
              {inbox.replying ? '📤 Sending...' : '📤 Send Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return (
    <div className="ib-container">
      {/* Sidebar - Folders */}
      <div className="ib-sidebar">
        <div className="ib-sidebar-title">📁 Folders</div>
        {inbox.folders.filter(f => f.type === 'system').map(f => (
          <button
            key={f.id}
            className={`ib-folder-btn ${inbox.activeFolder === f.id ? 'active' : ''}`}
            onClick={() => inbox.setActiveFolder(f.id)}
          >
            <span className="ib-folder-icon">{f.icon}</span>
            <span className="ib-folder-name">{f.name}</span>
            {f.unread > 0 && <span className="ib-folder-badge">{f.unread}</span>}
            {f.unread === 0 && f.count > 0 && <span className="ib-folder-count">{f.count}</span>}
          </button>
        ))}

        {inbox.folders.filter(f => f.type === 'client').length > 0 && (
          <>
            <div className="ib-sidebar-divider" />
            <div className="ib-sidebar-title">🏢 By Client</div>
            {inbox.folders.filter(f => f.type === 'client').map(f => (
              <button
                key={f.id}
                className={`ib-folder-btn client ${inbox.activeFolder === f.id ? 'active' : ''}`}
                onClick={() => inbox.setActiveFolder(f.id)}
              >
                <span className="ib-folder-icon">{f.icon}</span>
                <span className="ib-folder-name">{f.name}</span>
                {f.unread > 0 && <span className="ib-folder-badge">{f.unread}</span>}
                {f.unread === 0 && <span className="ib-folder-count">{f.count}</span>}
              </button>
            ))}
          </>
        )}

        {/* Stats */}
        <div className="ib-sidebar-divider" />
        <div className="ib-stats-mini">
          <div className="ib-stat-row"><span>Unread</span><span className="ib-stat-val unread">{inbox.stats.unread}</span></div>
          <div className="ib-stat-row"><span>Pending</span><span className="ib-stat-val pending">{inbox.stats.pending}</span></div>
          <div className="ib-stat-row"><span>Answered</span><span className="ib-stat-val answered">{inbox.stats.answered}</span></div>
        </div>

        {/* Empty Trash button */}
        {inbox.activeFolder === 'trash' && inbox.emails.length > 0 && (
          <div style={{ padding: '0.75rem' }}>
            <button className="ib-empty-trash-btn" onClick={inbox.emptyTrash}>
              🗑️ Empty Trash
            </button>
          </div>
        )}
      </div>

      {/* Main - Email List */}
      <div className="ib-main">
        {/* Toolbar */}
        <div className="ib-toolbar">
          <div className="ib-search-box">
            <span className="ib-search-icon">🔍</span>
            <input
              className="ib-search-input"
              placeholder="Search emails, clients..."
              value={inbox.searchQuery}
              onChange={e => inbox.setSearchQuery(e.target.value)}
            />
          </div>
          <div className="ib-toolbar-actions">
            <select className="ib-sort-select" value={inbox.clientFilter} onChange={e => inbox.setClientFilter(e.target.value)}>
              <option value="all">All Clients</option>
              {inbox.matchedClients.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select className="ib-sort-select" value={inbox.sortBy} onChange={e => inbox.setSortBy(e.target.value as any)}>
              <option value="date">Sort by Date</option>
              <option value="client">Sort by Client</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="ib-results-info">
          {inbox.emails.length} email{inbox.emails.length !== 1 ? 's' : ''}
          {inbox.searchQuery && ` matching "${inbox.searchQuery}"`}
          {inbox.activeFolder === 'trash' && ' in Trash'}
        </div>

        {/* Email List */}
        {inbox.emails.length === 0 ? (
          <div className="ib-empty">
            <div className="ib-empty-icon">{inbox.activeFolder === 'trash' ? '🗑️' : '📭'}</div>
            <p>{inbox.activeFolder === 'trash' ? 'Trash is empty' : 'No emails found'}</p>
          </div>
        ) : (
          <div className="ib-email-list">
            {inbox.emails.map(email => (
              <div
                key={email.id}
                className={`ib-email-row ${!email.read ? 'unread' : ''} ${email.answered ? 'answered' : ''} ${email.folder === 'trash' ? 'trashed' : ''}`}
                onClick={() => inbox.openEmail(email)}
              >
                <button
                  className="ib-star-btn"
                  onClick={e => { e.stopPropagation(); inbox.toggleStar(email.id); }}
                >
                  {email.starred ? '⭐' : '☆'}
                </button>
                <div className="ib-email-avatar">{email.from_name.charAt(0)}</div>
                <div className="ib-email-content">
                  <div className="ib-email-top-row">
                    <span className={`ib-email-sender ${!email.read ? 'bold' : ''}`}>{email.from_name}</span>
                    <span className="ib-email-date">{fmtDate(email.date)}</span>
                  </div>
                  <div className={`ib-email-subject ${!email.read ? 'bold' : ''}`}>{email.subject}</div>
                  <div className="ib-email-preview">{email.body.substring(0, 120)}...</div>
                  <div className="ib-email-tags">
                    {email.matched_client_name && (
                      <span className="ib-tag client">🏢 {email.matched_client_name}</span>
                    )}
                    {email.attachments.length > 0 && (
                      <span className="ib-tag attachment">📎 {email.attachments.length}</span>
                    )}
                    {email.cc.length > 0 && (
                      <span className="ib-tag cc">CC: {email.cc.length}</span>
                    )}
                    {email.replies && email.replies.length > 0 && (
                      <span className="ib-tag thread">💬 {email.replies.length}</span>
                    )}
                    {email.answered && <span className="ib-tag answered">✅ Answered</span>}
                    {!email.answered && email.read && email.folder !== 'trash' && <span className="ib-tag pending">⏳ Pending</span>}
                    {!email.read && <span className="ib-tag unread">🔵 New</span>}
                  </div>
                </div>
                {/* Quick delete from list */}
                {inbox.activeFolder === 'trash' ? (
                  <div className="ib-row-actions" onClick={e => e.stopPropagation()}>
                    <button className="ib-row-action restore" onClick={() => inbox.restoreEmail(email.id)} title="Restore">↩️</button>
                    <button className="ib-row-action perm-delete" onClick={() => inbox.permanentDelete(email.id)} title="Delete permanently">💀</button>
                  </div>
                ) : (
                  <button
                    className="ib-row-delete"
                    onClick={e => { e.stopPropagation(); inbox.deleteEmail(email.id); }}
                    title="Move to Trash"
                  >🗑️</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
