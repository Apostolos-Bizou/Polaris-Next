'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface InboxEmail {
  id: string;
  from: string;
  from_name: string;
  to: string;
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
}

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface EmailThread {
  thread_id: string;
  subject: string;
  participants: string[];
  messages: InboxEmail[];
  last_date: string;
  unread_count: number;
  matched_client_id: string | null;
  matched_client_name: string | null;
  starred: boolean;
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

export type InboxView = 'list' | 'thread';
export type SortBy = 'date' | 'client' | 'status';

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
  // Direct email match
  const direct = clients.find(c => c.email === addr);
  if (direct) return { id: direct.id, name: direct.name };
  // Domain match (e.g., @aims-shipping.com → AIMS)
  const domain = addr.split('@')[1];
  if (domain) {
    const domainMatch = clients.find(c => c.email.includes(domain));
    if (domainMatch) return { id: domainMatch.id, name: domainMatch.name };
  }
  return null;
}

// ─── Demo emails (until real IMAP/API connected) ──────────────────
function generateDemoEmails(clients: typeof clientsForMatching): InboxEmail[] {
  const now = Date.now();
  const day = 86400000;

  const demos: Partial<InboxEmail>[] = [
    { from: 'manning@aims-shipping.com', from_name: 'GIANNHS KAKKARIS', subject: 'RE: Insurance Coverage Update - Q1 2025', body: 'Dear Polaris Team,\n\nThank you for the updated coverage report. We have reviewed the Q1 claims summary and everything looks good.\n\nPlease proceed with the renewal documentation for AIMS GOLD subsidiary.\n\nBest regards,\nGiannhs Kakkaris\nCrew Manager', date: new Date(now - day * 1).toISOString(), read: false, answered: false, starred: true },
    { from: 'insurance@centrofin.gr', from_name: 'MALEGOU MARIA', subject: 'Outstanding Balance - Centrofin Marine Trust', body: 'Dear Polaris,\n\nWe acknowledge receipt of the outstanding balance notification for Centrofin Marine Trust accounts.\n\nPayment will be processed within the next 5 business days. Please find attached the payment confirmation from our bank.\n\nRegards,\nMaria Malegou', date: new Date(now - day * 1).toISOString(), read: false, answered: false, starred: false },
    { from: 'mfotinos@dianashippingservices.com', from_name: 'FOTINOS MICHALIS', subject: 'New Crew Members - Diana Shipping', body: 'Hi Polaris,\n\nWe have 15 new crew members joining M/V Diana Navigator next month. Please find the enrollment forms attached.\n\nAlso, please update the member count for Diana Gold and Diana Platinum subsidiaries.\n\nThanks,\nMichalis Fotinos', date: new Date(now - day * 2).toISOString(), read: true, answered: true, starred: false },
    { from: 's.varias@crossworldmarine.com', from_name: 'SIMOS VARIAS', subject: 'RE: Contract Renewal - Crossworld Marine', body: 'Dear Team,\n\nWe have reviewed the renewal terms and we are happy to proceed. However, we would like to discuss the premium adjustment for the Bourbon and Cassiopeia subsidiaries.\n\nCan we schedule a meeting next week?\n\nBest,\nSimos Varias\nCEO', date: new Date(now - day * 2).toISOString(), read: true, answered: false, starred: true },
    { from: 'crew@astraship.com', from_name: 'NIKOS TROUSAS', subject: 'Claim Report - Hospitalization Case #4521', body: 'Dear Polaris Claims Team,\n\nPlease find attached the medical report for case #4521. The crew member was hospitalized in Manila for 5 days.\n\nTotal cost: $8,500 USD\nHospital: Makati Medical Center\n\nPlease process this claim at your earliest convenience.\n\nBest regards,\nNikos Trousas', date: new Date(now - day * 3).toISOString(), read: true, answered: true, starred: false },
    { from: 'agabriel@goldenunion.gr', from_name: 'ALEXANDROS GABRIEL', subject: 'Revolving Fund Status - Golden Union', body: 'Dear Polaris Finance,\n\nPlease confirm the current revolving fund balance for Golden Union Shipping and its subsidiaries.\n\nWe want to ensure adequate funds are available for Q2.\n\nRegards,\nAlexandros Gabriel', date: new Date(now - day * 4).toISOString(), read: true, answered: true, starred: false },
    { from: 'crew@efnav.gr', from_name: 'MANOS VICHOS', subject: 'Annual Medical Checkups - Efnav', body: 'Dear Polaris,\n\nWe would like to schedule annual medical checkups for our 45 active seafarers.\n\nCould you provide us with the list of approved clinics in Piraeus area?\n\nThank you,\nManos Vichos', date: new Date(now - day * 5).toISOString(), read: false, answered: false, starred: false },
    { from: 'pkomitopoulos@kymar.gr', from_name: 'PETROS KOMITOPOULOS', subject: 'RE: Premium Invoice - Kyklades Maritime', body: 'Hello,\n\nWe received the premium invoice for Q1. Please correct the member count - we have 85 members, not 92.\n\n7 members were cancelled in February.\n\nPlease issue a revised invoice.\n\nThanks,\nPetros Komitopoulos', date: new Date(now - day * 6).toISOString(), read: true, answered: false, starred: false },
    { from: 'noreply@polaris-tpa.com', from_name: 'Polaris System', subject: 'Weekly Claims Summary Report', body: 'This is an automated weekly summary:\n\n- New claims processed: 47\n- Total approved: $32,500\n- Pending review: 8\n- Rejected: 2\n\nView full report in the admin dashboard.', date: new Date(now - day * 7).toISOString(), read: true, answered: false, starred: false, folder: 'sent' },
    { from: 'noreply@polaris-tpa.com', from_name: 'Polaris System', subject: 'Contract Renewal Reminder - Crossworld Marine', body: 'Automated reminder:\n\nThe contract for CROSSWORLD MARINE SERVICES INC is due for renewal on 2027-02-05.\n\nPlease initiate the renewal process.', date: new Date(now - day * 8).toISOString(), read: true, answered: false, starred: false, folder: 'sent' },
  ];

  return demos.map((d, i) => {
    const match = matchEmailToClient(d.from || '', clients);
    return {
      id: `email-${i + 1}`,
      from: d.from || '',
      from_name: d.from_name || '',
      to: 'admin@polaris-tpa.com',
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
      attachments: [],
      matched_client_id: match?.id || null,
      matched_client_name: match?.name || null,
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
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [clientFilter, setClientFilter] = useState('all');

  // Load emails
  useEffect(() => {
    async function load() {
      setLoading(true);
      const clients = await loadClientsForMatching();

      // TODO: In production, fetch from IMAP/Gmail/Outlook API
      // For now, use demo emails
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
    const starredEmails = emails.filter(e => e.starred);
    const unreadEmails = inboxEmails.filter(e => !e.read);
    const answeredEmails = inboxEmails.filter(e => e.answered);
    const pendingEmails = inboxEmails.filter(e => !e.answered && e.read);

    const systemFolders: InboxFolder[] = [
      { id: 'inbox', name: 'Inbox', icon: '📥', count: inboxEmails.length, unread: unreadEmails.length, type: 'system' },
      { id: 'unread', name: 'Unread', icon: '🔵', count: unreadEmails.length, unread: unreadEmails.length, type: 'system' },
      { id: 'starred', name: 'Starred', icon: '⭐', count: starredEmails.length, unread: 0, type: 'system' },
      { id: 'answered', name: 'Answered', icon: '✅', count: answeredEmails.length, unread: 0, type: 'system' },
      { id: 'pending', name: 'Pending Reply', icon: '⏳', count: pendingEmails.length, unread: pendingEmails.length, type: 'system' },
      { id: 'sent', name: 'Sent', icon: '📤', count: sentEmails.length, unread: 0, type: 'system' },
    ];

    // Client folders — auto-generated from matched emails
    const clientMap: Record<string, { id: string; name: string; count: number; unread: number }> = {};
    emails.forEach(e => {
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

    // Folder filter
    if (activeFolder === 'inbox') result = result.filter(e => e.folder === 'inbox');
    else if (activeFolder === 'sent') result = result.filter(e => e.folder === 'sent');
    else if (activeFolder === 'unread') result = result.filter(e => !e.read);
    else if (activeFolder === 'starred') result = result.filter(e => e.starred);
    else if (activeFolder === 'answered') result = result.filter(e => e.answered);
    else if (activeFolder === 'pending') result = result.filter(e => !e.answered && e.read && e.folder === 'inbox');
    else if (activeFolder.startsWith('client-')) {
      const cid = activeFolder.replace('client-', '');
      result = result.filter(e => e.matched_client_id === cid);
    }

    // Client filter
    if (clientFilter !== 'all') {
      result = result.filter(e => e.matched_client_id === clientFilter);
    }

    // Search
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

    // Sort
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
        if (e.matched_client_name) {
          acc[e.matched_client_name] = (acc[e.matched_client_name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }, [emails]);

  // ═══ Actions ═══
  const openEmail = useCallback((email: InboxEmail) => {
    setSelectedEmail(email);
    setView('thread');
    // Mark as read
    if (!email.read) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    }
  }, []);

  const closeEmail = useCallback(() => {
    setSelectedEmail(null);
    setView('list');
    setReplyText('');
    setReplying(false);
  }, []);

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

  const sendReply = useCallback(async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);

    try {
      // TODO: Send via SMTP/API
      // For now, simulate
      await new Promise(r => setTimeout(r, 1000));

      // Mark as answered
      setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, answered: true } : e));
      setSelectedEmail(prev => prev ? { ...prev, answered: true } : null);
      setReplyText('');
      setReplying(false);
    } catch {
      setReplying(false);
    }
  }, [selectedEmail, replyText]);

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
    emails: filteredEmails,
    allEmails: emails,
    loading,
    selectedEmail, openEmail, closeEmail,
    activeFolder, setActiveFolder,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    view,
    folders,
    stats,
    clientFilter, setClientFilter, matchedClients,
    toggleStar, markAsRead, markAsUnread, markAsAnswered,
    replyText, setReplyText, sendReply, replying,
  };
}
