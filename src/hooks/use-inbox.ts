'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface InboxEmail {
  id: string;
  from: string;
  from_name: string;
  to: string;
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  body_html: string;
  date: string;
  timestamp: number;
  read: boolean;
  starred: boolean;
  answered: boolean;
  folder: string;
  thread_id: string;
  attachments: EmailAttachment[];
  // Client matching
  matched_client_id: string | null;
  matched_client_name: string | null;
  // Thread
  replies: InboxEmail[];
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface InboxFolder {
  id: string;
  name: string;
  icon: string;
  count: number;
  unread: number;
  type: 'system' | 'client' | 'custom';
  client_id?: string;
}

export interface InboxStats {
  total: number;
  unread: number;
  answered: number;
  pending: number;
  starred: number;
  by_client: Record<string, number>;
}

export type InboxView = 'list' | 'thread' | 'forward';
export type SortBy = 'date' | 'client' | 'status';
export type ReplyMode = 'reply' | 'reply-all' | 'forward';

// ─── Client cache for matching ────────────────────────────────────
let clientsForMatching: { id: string; name: string; email: string; contact_name: string }[] = [];

async function loadClientsForMatching() {
  if (clientsForMatching.length > 0) return clientsForMatching;
  try {
    const res = await fetch('/api/proxy/getClients');
    const data = await res.json();
    if (data.success && data.data) {
      clientsForMatching = data.data.map((c: any) => ({
        id: c.client_id || '',
        name: c.client_name || '',
        email: (c.contact_email || '').toLowerCase(),
        contact_name: c.contact_name || '',
      }));
    }
  } catch { /* empty */ }
  return clientsForMatching;
}

// ─── Match email to client ────────────────────────────────────────
function matchEmailToClient(emailAddress: string, clients: typeof clientsForMatching): { id: string; name: string } | null {
  const addr = emailAddress.toLowerCase();
  const direct = clients.find(c => c.email === addr);
  if (direct) return { id: direct.id, name: direct.name };
  const domain = addr.split('@')[1];
  if (domain) {
    const domainMatch = clients.find(c => c.email.includes(domain));
    if (domainMatch) return { id: domainMatch.id, name: domainMatch.name };
  }
  return null;
}

// ─── Demo emails ──────────────────────────────────────────────────
function generateDemoEmails(clients: typeof clientsForMatching): InboxEmail[] {
  const now = Date.now();
  const day = 86400000;

  const demos: Partial<InboxEmail>[] = [
    {
      from: 'manning@aims-shipping.com', from_name: 'GIANNHS KAKKARIS',
      subject: 'RE: Insurance Coverage Update - Q1 2025',
      body: 'Dear Polaris Team,\n\nThank you for the updated coverage report. We have reviewed the Q1 claims summary and everything looks good.\n\nPlease proceed with the renewal documentation for AIMS GOLD subsidiary.\n\nBest regards,\nGiannhs Kakkaris\nCrew Manager',
      date: new Date(now - day * 1).toISOString(), read: false, answered: false, starred: true,
      cc: ['insurance@aims-shipping.com', 'hr@aims-shipping.com'],
      attachments: [
        { id: 'att-1', name: 'Q1_Claims_Summary.pdf', size: 245760, type: 'application/pdf' },
        { id: 'att-2', name: 'Coverage_Update.xlsx', size: 89600, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      ],
    },
    {
      from: 'insurance@centrofin.gr', from_name: 'MALEGOU MARIA',
      subject: 'Outstanding Balance - Centrofin Marine Trust',
      body: 'Dear Polaris,\n\nWe acknowledge receipt of the outstanding balance notification for Centrofin Marine Trust accounts.\n\nPayment will be processed within the next 5 business days. Please find attached the payment confirmation from our bank.\n\nRegards,\nMaria Malegou',
      date: new Date(now - day * 1).toISOString(), read: false, answered: false, starred: false,
      attachments: [
        { id: 'att-3', name: 'Payment_Confirmation.pdf', size: 156000, type: 'application/pdf' },
      ],
    },
    {
      from: 'mfotinos@dianashippingservices.com', from_name: 'FOTINOS MICHALIS',
      subject: 'New Crew Members - Diana Shipping',
      body: 'Hi Polaris,\n\nWe have 15 new crew members joining M/V Diana Navigator next month. Please find the enrollment forms attached.\n\nAlso, please update the member count for Diana Gold and Diana Platinum subsidiaries.\n\nThanks,\nMichalis Fotinos',
      date: new Date(now - day * 2).toISOString(), read: true, answered: true, starred: false,
      cc: ['crew@dianashippingservices.com'],
      attachments: [
        { id: 'att-4', name: 'Enrollment_Forms_15crew.pdf', size: 512000, type: 'application/pdf' },
        { id: 'att-5', name: 'Crew_List_March2026.xlsx', size: 67800, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { id: 'att-6', name: 'Medical_Certificates.zip', size: 2048000, type: 'application/zip' },
      ],
      replies: [{
        id: 'reply-3-1', from: 'admin@polaris-tpa.com', from_name: 'Polaris Admin',
        to: 'mfotinos@dianashippingservices.com', cc: ['crew@dianashippingservices.com'], bcc: [],
        subject: 'RE: New Crew Members - Diana Shipping',
        body: 'Dear Mr. Fotinos,\n\nThank you for the enrollment forms. We have processed the 15 new crew members and updated the member counts accordingly.\n\nDiana Gold: 42 → 49 members\nDiana Platinum: 28 → 36 members\n\nAll medical certificates have been verified.\n\nBest regards,\nPolaris Admin Team',
        body_html: '', date: new Date(now - day * 1.5).toISOString(), timestamp: now - day * 1.5,
        read: true, starred: false, answered: true, folder: 'sent', thread_id: 'thread-3',
        attachments: [], matched_client_id: null, matched_client_name: null, replies: [],
      }],
    },
    {
      from: 's.varias@crossworldmarine.com', from_name: 'SIMOS VARIAS',
      subject: 'RE: Contract Renewal - Crossworld Marine',
      body: 'Dear Team,\n\nWe have reviewed the renewal terms and we are happy to proceed. However, we would like to discuss the premium adjustment for the Bourbon and Cassiopeia subsidiaries.\n\nCan we schedule a meeting next week?\n\nBest,\nSimos Varias\nCEO',
      date: new Date(now - day * 2).toISOString(), read: true, answered: false, starred: true,
      cc: ['finance@crossworldmarine.com'],
    },
    {
      from: 'crew@astraship.com', from_name: 'NIKOS TROUSAS',
      subject: 'Claim Report - Hospitalization Case #4521',
      body: 'Dear Polaris Claims Team,\n\nPlease find attached the medical report for case #4521. The crew member was hospitalized in Manila for 5 days.\n\nTotal cost: $8,500 USD\nHospital: Makati Medical Center\n\nPlease process this claim at your earliest convenience.\n\nBest regards,\nNikos Trousas',
      date: new Date(now - day * 3).toISOString(), read: true, answered: true, starred: false,
      attachments: [
        { id: 'att-7', name: 'Medical_Report_4521.pdf', size: 890000, type: 'application/pdf' },
        { id: 'att-8', name: 'Hospital_Invoice.pdf', size: 245000, type: 'application/pdf' },
        { id: 'att-9', name: 'Discharge_Summary.jpg', size: 1230000, type: 'image/jpeg' },
      ],
    },
    {
      from: 'agabriel@goldenunion.gr', from_name: 'ALEXANDROS GABRIEL',
      subject: 'Revolving Fund Status - Golden Union',
      body: 'Dear Polaris Finance,\n\nPlease confirm the current revolving fund balance for Golden Union Shipping and its subsidiaries.\n\nWe want to ensure adequate funds are available for Q2.\n\nRegards,\nAlexandros Gabriel',
      date: new Date(now - day * 4).toISOString(), read: true, answered: true, starred: false,
    },
    {
      from: 'crew@efnav.gr', from_name: 'MANOS VICHOS',
      subject: 'Annual Medical Checkups - Efnav',
      body: 'Dear Polaris,\n\nWe would like to schedule annual medical checkups for our 45 active seafarers.\n\nCould you provide us with the list of approved clinics in Piraeus area?\n\nThank you,\nManos Vichos',
      date: new Date(now - day * 5).toISOString(), read: false, answered: false, starred: false,
    },
    {
      from: 'pkomitopoulos@kymar.gr', from_name: 'PETROS KOMITOPOULOS',
      subject: 'RE: Premium Invoice - Kyklades Maritime',
      body: 'Hello,\n\nWe received the premium invoice for Q1. Please correct the member count - we have 85 members, not 92.\n\n7 members were cancelled in February.\n\nPlease issue a revised invoice.\n\nThanks,\nPetros Komitopoulos',
      date: new Date(now - day * 6).toISOString(), read: true, answered: false, starred: false,
    },
    {
      from: 'noreply@polaris-tpa.com', from_name: 'Polaris System',
      subject: 'Weekly Claims Summary Report',
      body: 'This is an automated weekly summary:\n\n- New claims processed: 47\n- Total approved: $32,500\n- Pending review: 8\n- Rejected: 2\n\nView full report in the admin dashboard.',
      date: new Date(now - day * 7).toISOString(), read: true, answered: false, starred: false, folder: 'sent',
    },
    {
      from: 'noreply@polaris-tpa.com', from_name: 'Polaris System',
      subject: 'Contract Renewal Reminder - Crossworld Marine',
      body: 'Automated reminder:\n\nThe contract for CROSSWORLD MARINE SERVICES INC is due for renewal on 2027-02-05.\n\nPlease initiate the renewal process.',
      date: new Date(now - day * 8).toISOString(), read: true, answered: false, starred: false, folder: 'sent',
    },
  ];

  return demos.map((d, i) => {
    const match = matchEmailToClient(d.from || '', clients);
    return {
      id: `email-${i + 1}`,
      from: d.from || '',
      from_name: d.from_name || '',
      to: 'admin@polaris-tpa.com',
      cc: d.cc || [],
      bcc: d.bcc || [],
      subject: d.subject || '',
      body: d.body || '',
      body_html: (d.body || '').replace(/\n/g, '<br/>'),
      date: d.date || new Date().toISOString(),
      timestamp: new Date(d.date || '').getTime(),
      read: d.read ?? false,
      starred: d.starred ?? false,
      answered: d.answered ?? false,
      folder: d.folder || 'inbox',
      thread_id: `thread-${i + 1}`,
      attachments: (d.attachments || []).map(a => ({ id: a.id || `att-auto-${i}`, name: a.name, size: a.size, type: a.type, url: a.url })),
      matched_client_id: match?.id || null,
      matched_client_name: match?.name || null,
      replies: d.replies || [],
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════
export function useInbox() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [view, setView] = useState<InboxView>('list');
  const [clientFilter, setClientFilter] = useState('all');

  // Reply state
  const [replyMode, setReplyMode] = useState<ReplyMode>('reply');
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyCC, setReplyCC] = useState<string[]>([]);
  const [replyBCC, setReplyBCC] = useState<string[]>([]);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);

  // Forward state
  const [forwardTo, setForwardTo] = useState('');
  const [forwardCC, setForwardCC] = useState<string[]>([]);
  const [forwardBCC, setForwardBCC] = useState<string[]>([]);
  const [forwardText, setForwardText] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [forwardAttachments, setForwardAttachments] = useState<File[]>([]);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load emails
  useEffect(() => {
    async function load() {
      setLoading(true);
      const clients = await loadClientsForMatching();
      const demoEmails = generateDemoEmails(clients);
      setEmails(demoEmails);
      setLoading(false);
    }
    load();
  }, []);

  // ═══ Folders ═══
  const folders = useMemo((): InboxFolder[] => {
    const inboxEmails = emails.filter(e => e.folder === 'inbox');
    const sentEmails = emails.filter(e => e.folder === 'sent');
    const trashEmails = emails.filter(e => e.folder === 'trash');
    const unreadEmails = inboxEmails.filter(e => !e.read);
    const starredEmails = emails.filter(e => e.starred && e.folder !== 'trash');
    const answeredEmails = inboxEmails.filter(e => e.answered);
    const pendingEmails = inboxEmails.filter(e => !e.answered && e.read);

    const systemFolders: InboxFolder[] = [
      { id: 'inbox', name: 'Inbox', icon: '📥', count: inboxEmails.length, unread: unreadEmails.length, type: 'system' },
      { id: 'unread', name: 'Unread', icon: '🔵', count: unreadEmails.length, unread: unreadEmails.length, type: 'system' },
      { id: 'starred', name: 'Starred', icon: '⭐', count: starredEmails.length, unread: 0, type: 'system' },
      { id: 'answered', name: 'Answered', icon: '✅', count: answeredEmails.length, unread: 0, type: 'system' },
      { id: 'pending', name: 'Pending Reply', icon: '⏳', count: pendingEmails.length, unread: pendingEmails.length, type: 'system' },
      { id: 'sent', name: 'Sent', icon: '📤', count: sentEmails.length, unread: 0, type: 'system' },
      { id: 'trash', name: 'Trash', icon: '🗑️', count: trashEmails.length, unread: 0, type: 'system' },
    ];

    // Client folders
    const clientMap: Record<string, { id: string; name: string; count: number; unread: number }> = {};
    emails.filter(e => e.folder !== 'trash').forEach(e => {
      if (e.matched_client_id && e.matched_client_name) {
        if (!clientMap[e.matched_client_id]) {
          clientMap[e.matched_client_id] = { id: e.matched_client_id, name: e.matched_client_name, count: 0, unread: 0 };
        }
        clientMap[e.matched_client_id].count++;
        if (!e.read) clientMap[e.matched_client_id].unread++;
      }
    });

    const clientFolders: InboxFolder[] = Object.values(clientMap)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        id: `client-${c.id}`,
        name: c.name,
        icon: '🏢',
        count: c.count,
        unread: c.unread,
        type: 'client' as const,
        client_id: c.id,
      }));

    return [...systemFolders, ...clientFolders];
  }, [emails]);

  // ═══ Filtered emails ═══
  const filteredEmails = useMemo(() => {
    let result = [...emails];

    if (activeFolder === 'inbox') result = result.filter(e => e.folder === 'inbox');
    else if (activeFolder === 'sent') result = result.filter(e => e.folder === 'sent');
    else if (activeFolder === 'trash') result = result.filter(e => e.folder === 'trash');
    else if (activeFolder === 'unread') result = result.filter(e => !e.read && e.folder !== 'trash');
    else if (activeFolder === 'starred') result = result.filter(e => e.starred && e.folder !== 'trash');
    else if (activeFolder === 'answered') result = result.filter(e => e.answered && e.folder === 'inbox');
    else if (activeFolder === 'pending') result = result.filter(e => !e.answered && e.read && e.folder === 'inbox');
    else if (activeFolder.startsWith('client-')) {
      const cid = activeFolder.replace('client-', '');
      result = result.filter(e => e.matched_client_id === cid && e.folder !== 'trash');
    }

    if (clientFilter !== 'all') {
      result = result.filter(e => e.matched_client_id === clientFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from_name.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        (e.matched_client_name || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'date') result.sort((a, b) => b.timestamp - a.timestamp);
    else if (sortBy === 'client') result.sort((a, b) => (a.matched_client_name || 'zzz').localeCompare(b.matched_client_name || 'zzz'));
    else if (sortBy === 'status') result.sort((a, b) => (a.answered ? 1 : 0) - (b.answered ? 1 : 0));

    return result;
  }, [emails, activeFolder, searchQuery, sortBy, clientFilter]);

  // ═══ Stats ═══
  const stats = useMemo((): InboxStats => {
    const inbox = emails.filter(e => e.folder === 'inbox');
    return {
      total: inbox.length,
      unread: inbox.filter(e => !e.read).length,
      answered: inbox.filter(e => e.answered).length,
      pending: inbox.filter(e => !e.answered && e.read).length,
      starred: emails.filter(e => e.starred).length,
      by_client: emails.reduce((acc, e) => {
        if (e.matched_client_name) acc[e.matched_client_name] = (acc[e.matched_client_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [emails]);

  // ═══ Open / Close email ═══
  const openEmail = useCallback((email: InboxEmail) => {
    setSelectedEmail(email);
    setView('thread');
    setReplyMode('reply');
    setReplyText('');
    setReplyCC([]);
    setReplyBCC([]);
    setShowCC(false);
    setShowBCC(false);
    setCcInput('');
    setBccInput('');
    setReplyAttachments([]);
    setDeleteConfirm(null);
    if (!email.read) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  }, []);

  const closeEmail = useCallback(() => {
    setSelectedEmail(null);
    setView('list');
    setReplyText('');
    setReplyCC([]);
    setReplyBCC([]);
    setShowCC(false);
    setShowBCC(false);
    setCcInput('');
    setBccInput('');
    setReplyAttachments([]);
    setForwardTo('');
    setForwardCC([]);
    setForwardBCC([]);
    setForwardText('');
    setForwardAttachments([]);
    setDeleteConfirm(null);
  }, []);

  // ═══ Star / Read / Answered ═══
  const toggleStar = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, starred: !e.starred } : e));
  }, []);

  const markAsRead = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, read: true } : e));
  }, []);

  const markAsUnread = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, read: false } : e));
  }, []);

  const markAsAnswered = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, answered: true } : e));
  }, []);

  // ═══ Reply ═══
  const startReply = useCallback((mode: ReplyMode) => {
    if (!selectedEmail) return;
    setReplyMode(mode);

    if (mode === 'reply') {
      setReplyCC([]);
      setShowCC(false);
    } else if (mode === 'reply-all') {
      // Auto-populate CC from original CC + To (minus ourselves)
      const allRecipients = [...(selectedEmail.cc || [])];
      if (selectedEmail.to && selectedEmail.to !== 'admin@polaris-tpa.com') {
        allRecipients.push(selectedEmail.to);
      }
      const uniqueCC = [...new Set(allRecipients.filter(e => e && e !== 'admin@polaris-tpa.com'))];
      setReplyCC(uniqueCC);
      setShowCC(uniqueCC.length > 0);
    } else if (mode === 'forward') {
      setView('forward');
      setForwardTo('');
      setForwardCC([]);
      setForwardBCC([]);
      // Build forwarded content
      const fwdHeader = `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.from_name} <${selectedEmail.from}>\nDate: ${new Date(selectedEmail.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to}\n${selectedEmail.cc.length > 0 ? 'Cc: ' + selectedEmail.cc.join(', ') + '\n' : ''}\n${selectedEmail.body}`;
      setForwardText(fwdHeader);
      setForwardAttachments([]);
      return;
    }

    // Build quoted text for reply
    const quotedDate = new Date(selectedEmail.date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    setReplyText('');
    setReplyAttachments([]);
  }, [selectedEmail]);

  // Build the quoted original message HTML for display
  const quotedOriginal = useMemo(() => {
    if (!selectedEmail) return '';
    const quotedDate = new Date(selectedEmail.date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `<div style="margin-top:1rem;padding-left:0.75rem;border-left:3px solid #D4AF37;color:#8899aa;font-size:0.9rem;"><p style="margin:0 0 0.5rem;font-size:0.8rem;">On ${quotedDate}, ${selectedEmail.from_name} &lt;${selectedEmail.from}&gt; wrote:</p>${selectedEmail.body_html}</div>`;
  }, [selectedEmail]);

  // Add CC recipient
  const addCC = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !replyCC.includes(trimmed)) {
      setReplyCC(prev => [...prev, trimmed]);
    }
    setCcInput('');
  }, [replyCC]);

  // Remove CC recipient
  const removeCC = useCallback((email: string) => {
    setReplyCC(prev => prev.filter(e => e !== email));
  }, []);

  // Add BCC recipient
  const addBCC = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !replyBCC.includes(trimmed)) {
      setReplyBCC(prev => [...prev, trimmed]);
    }
    setBccInput('');
  }, [replyBCC]);

  // Remove BCC recipient
  const removeBCC = useCallback((email: string) => {
    setReplyBCC(prev => prev.filter(e => e !== email));
  }, []);

  // Add reply attachment
  const addReplyAttachment = useCallback((files: FileList | null) => {
    if (!files) return;
    setReplyAttachments(prev => [...prev, ...Array.from(files)]);
  }, []);

  const removeReplyAttachment = useCallback((index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send reply
  const sendReply = useCallback(async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);

    try {
      // TODO: In production, send via SMTP/API with CC, BCC, attachments
      await new Promise(r => setTimeout(r, 1200));

      // Create reply email
      const replyEmail: InboxEmail = {
        id: `reply-${Date.now()}`,
        from: 'admin@polaris-tpa.com',
        from_name: 'Polaris Admin',
        to: selectedEmail.from,
        cc: replyCC,
        bcc: replyBCC,
        subject: `RE: ${selectedEmail.subject.replace(/^RE:\s*/i, '')}`,
        body: replyText,
        body_html: replyText.replace(/\n/g, '<br/>'),
        date: new Date().toISOString(),
        timestamp: Date.now(),
        read: true,
        starred: false,
        answered: true,
        folder: 'sent',
        thread_id: selectedEmail.thread_id,
        attachments: replyAttachments.map((f, i) => ({
          id: `att-reply-${i}`,
          name: f.name,
          size: f.size,
          type: f.type,
        })),
        matched_client_id: selectedEmail.matched_client_id,
        matched_client_name: selectedEmail.matched_client_name,
        replies: [],
      };

      // Add reply to thread & mark original as answered
      setEmails(prev => prev.map(e => {
        if (e.id === selectedEmail.id) {
          return { ...e, answered: true, replies: [...(e.replies || []), replyEmail] };
        }
        return e;
      }));
      // Also add to emails list as sent
      setEmails(prev => [...prev, replyEmail]);

      // Update selected email
      setSelectedEmail(prev => prev ? {
        ...prev, answered: true,
        replies: [...(prev.replies || []), replyEmail]
      } : null);

      setReplyText('');
      setReplyCC([]);
      setReplyBCC([]);
      setShowCC(false);
      setShowBCC(false);
      setCcInput('');
      setBccInput('');
      setReplyAttachments([]);
      setReplying(false);
    } catch {
      setReplying(false);
    }
  }, [selectedEmail, replyText, replyCC, replyBCC, replyAttachments]);

  // ═══ Forward ═══
  const addForwardCC = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !forwardCC.includes(trimmed)) setForwardCC(prev => [...prev, trimmed]);
  }, [forwardCC]);

  const removeForwardCC = useCallback((email: string) => {
    setForwardCC(prev => prev.filter(e => e !== email));
  }, []);

  const addForwardBCC = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !forwardBCC.includes(trimmed)) setForwardBCC(prev => [...prev, trimmed]);
  }, [forwardBCC]);

  const removeForwardBCC = useCallback((email: string) => {
    setForwardBCC(prev => prev.filter(e => e !== email));
  }, []);

  const addForwardAttachment = useCallback((files: FileList | null) => {
    if (!files) return;
    setForwardAttachments(prev => [...prev, ...Array.from(files)]);
  }, []);

  const removeForwardAttachment = useCallback((index: number) => {
    setForwardAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const sendForward = useCallback(async () => {
    if (!selectedEmail || !forwardTo.trim()) return;
    setForwarding(true);

    try {
      await new Promise(r => setTimeout(r, 1200));

      const fwdEmail: InboxEmail = {
        id: `fwd-${Date.now()}`,
        from: 'admin@polaris-tpa.com',
        from_name: 'Polaris Admin',
        to: forwardTo,
        cc: forwardCC,
        bcc: forwardBCC,
        subject: `Fwd: ${selectedEmail.subject.replace(/^Fwd:\s*/i, '')}`,
        body: forwardText,
        body_html: forwardText.replace(/\n/g, '<br/>'),
        date: new Date().toISOString(),
        timestamp: Date.now(),
        read: true,
        starred: false,
        answered: true,
        folder: 'sent',
        thread_id: `thread-fwd-${Date.now()}`,
        attachments: [
          ...selectedEmail.attachments,
          ...forwardAttachments.map((f, i) => ({
            id: `att-fwd-${i}`,
            name: f.name,
            size: f.size,
            type: f.type,
          })),
        ],
        matched_client_id: null,
        matched_client_name: null,
        replies: [],
      };

      setEmails(prev => [...prev, fwdEmail]);
      setForwarding(false);
      setView('thread');
      setForwardTo('');
      setForwardCC([]);
      setForwardBCC([]);
      setForwardText('');
      setForwardAttachments([]);
    } catch {
      setForwarding(false);
    }
  }, [selectedEmail, forwardTo, forwardCC, forwardBCC, forwardText, forwardAttachments]);

  const cancelForward = useCallback(() => {
    setView('thread');
    setForwardTo('');
    setForwardCC([]);
    setForwardBCC([]);
    setForwardText('');
    setForwardAttachments([]);
  }, []);

  // ═══ Delete ═══
  const deleteEmail = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, folder: 'trash' } : e));
    if (selectedEmail?.id === emailId) {
      closeEmail();
    }
    setDeleteConfirm(null);
  }, [selectedEmail, closeEmail]);

  const restoreEmail = useCallback((emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, folder: 'inbox' } : e));
  }, []);

  const permanentDelete = useCallback((emailId: string) => {
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) closeEmail();
  }, [selectedEmail, closeEmail]);

  const emptyTrash = useCallback(() => {
    setEmails(prev => prev.filter(e => e.folder !== 'trash'));
  }, []);

  // ═══ Unique clients for filter ═══
  const matchedClients = useMemo(() => {
    const map: Record<string, string> = {};
    emails.forEach(e => {
      if (e.matched_client_id && e.matched_client_name) {
        map[e.matched_client_id] = e.matched_client_name;
      }
    });
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
  }, [emails]);

  return {
    // Core
    emails: filteredEmails,
    allEmails: emails,
    loading,
    selectedEmail, openEmail, closeEmail,
    activeFolder, setActiveFolder,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    view, setView,
    folders,
    stats,
    clientFilter, setClientFilter, matchedClients,
    toggleStar, markAsRead, markAsUnread, markAsAnswered,

    // Reply
    replyMode, startReply,
    replyText, setReplyText, sendReply, replying,
    replyCC, addCC, removeCC, showCC, setShowCC, ccInput, setCcInput,
    replyBCC, addBCC, removeBCC, showBCC, setShowBCC, bccInput, setBccInput,
    replyAttachments, addReplyAttachment, removeReplyAttachment,
    quotedOriginal,

    // Forward
    forwardTo, setForwardTo,
    forwardCC, addForwardCC, removeForwardCC,
    forwardBCC, addForwardBCC, removeForwardBCC,
    forwardText, setForwardText,
    sendForward, forwarding, cancelForward,
    forwardAttachments, addForwardAttachment, removeForwardAttachment,

    // Delete
    deleteEmail, restoreEmail, permanentDelete, emptyTrash,
    deleteConfirm, setDeleteConfirm,
  };
}
