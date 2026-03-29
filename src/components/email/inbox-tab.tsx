'use client';

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
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

export default function InboxTab() {
  const inbox = useInbox();

  if (inbox.loading) {
    return <div className="ib-loading"><div className="ib-spinner" />Loading inbox...</div>;
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
          </div>
        </div>

        {/* Subject */}
        <h2 className="ib-thread-subject">{email.subject}</h2>

        {/* Client Badge */}
        {email.matched_client_name && (
          <a href={`/clients/${email.matched_client_id}`} className="ib-client-badge">
            🏢 {email.matched_client_name} → Open Client Folder
          </a>
        )}

        {/* Email Content */}
        <div className="ib-thread-email">
          <div className="ib-thread-meta">
            <div className="ib-thread-sender">
              <div className="ib-avatar">{email.from_name.charAt(0)}</div>
              <div>
                <div className="ib-sender-name">{email.from_name}</div>
                <div className="ib-sender-email">{email.from}</div>
              </div>
            </div>
            <div className="ib-thread-date">{fmtFullDate(email.date)}</div>
          </div>
          <div className="ib-thread-body" dangerouslySetInnerHTML={{ __html: email.body_html }} />

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="ib-attachments">
              <div className="ib-attachments-title">📎 Attachments</div>
              {email.attachments.map((a, i) => (
                <div key={i} className="ib-attachment-item">
                  📄 {a.name} ({(a.size / 1024).toFixed(0)} KB)
                </div>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="ib-thread-status">
            <span className={`ib-status-tag ${email.answered ? 'answered' : 'pending'}`}>
              {email.answered ? '✅ Answered' : '⏳ Pending Reply'}
            </span>
          </div>
        </div>

        {/* Reply Section */}
        <div className="ib-reply-section">
          <div className="ib-reply-header">↩️ Reply to {email.from_name}</div>
          <RichEditor
            value={inbox.replyText}
            onChange={inbox.setReplyText}
            placeholder="Type your reply..."
          />
          <div className="ib-reply-actions">
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
        </div>

        {/* Email List */}
        {inbox.emails.length === 0 ? (
          <div className="ib-empty">
            <div className="ib-empty-icon">📭</div>
            <p>No emails found</p>
          </div>
        ) : (
          <div className="ib-email-list">
            {inbox.emails.map(email => (
              <div
                key={email.id}
                className={`ib-email-row ${!email.read ? 'unread' : ''} ${email.answered ? 'answered' : ''}`}
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
                    {email.answered && <span className="ib-tag answered">✅ Answered</span>}
                    {!email.answered && email.read && <span className="ib-tag pending">⏳ Pending</span>}
                    {!email.read && <span className="ib-tag unread">🔵 New</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
