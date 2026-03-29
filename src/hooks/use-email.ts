'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export interface EmailTemplate {
  template_id: string;
  template_name: string;
  category: string;
  subject: string;
  body?: string;
}

export interface EmailClient {
  id: string;
  name: string;
  isChild: boolean;
  contact_name: string;
  contact_email: string;
  contact_capacity: string;
}

export interface EmailRecipient {
  name: string;
  email: string;
  role: string;
  selected: boolean;
}

export interface EmailHistoryItem {
  id: string;
  date: string;
  client: string;
  subject: string;
  recipients: string;
  status: string;
  template: string;
}

export interface ScheduledEmail {
  id: string;
  date: string;
  time: string;
  client: string;
  template: string;
  role: string;
  status: string;
  notes: string;
}

// ─── Default templates (fallback if API fails) ────────────────────
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { template_id: 'contract_01', template_name: 'New Contract Documents', category: 'contract', subject: 'Your Polaris Health Insurance Contract - {{client_name}}' },
  { template_id: 'welcome_01', template_name: 'Welcome New Client', category: 'client', subject: 'Welcome to Polaris Financial Services, {{client_name}}!' },
  { template_id: 'meeting_01', template_name: 'Post-Meeting Follow-up', category: 'client', subject: 'Thank You for Meeting with Polaris - Next Steps' },
  { template_id: 'renewal_01', template_name: 'Contract Renewal Reminder', category: 'contract', subject: 'Contract Renewal Notice - {{client_name}}' },
  { template_id: 'balance_01', template_name: 'Outstanding Balance', category: 'finance', subject: 'Payment Reminder - Outstanding Balance' },
  { template_id: 'revolving_01', template_name: 'Revolving Fund Alert', category: 'alert', subject: 'URGENT: Revolving Fund Below 50%' },
  { template_id: 'wishes_01', template_name: 'Holiday Wishes', category: 'wishes', subject: "Season's Greetings from Polaris!" },
  { template_id: 'wishes_02', template_name: 'Easter Wishes', category: 'wishes', subject: 'Happy Easter from Polaris!' },
  { template_id: 'wishes_03', template_name: 'Birthday Wishes', category: 'wishes', subject: 'Happy Birthday from Polaris!' },
];

// ─── Email config interface for SMTP/OAuth ────────────────────────
export interface EmailConfig {
  provider: 'polaris' | 'smtp' | 'gmail' | 'outlook';
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_pass?: string;
  from_name?: string;
  from_email?: string;
  connected: boolean;
}

// ─── Client cache ─────────────────────────────────────────────────
let cachedClients: EmailClient[] | null = null;

// ─── Hook ─────────────────────────────────────────────────────────
export function useEmailCenter() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history' | 'bulk' | 'scheduler'>('compose');

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [templateFilter, setTemplateFilter] = useState('all');

  // Clients
  const [clients, setClients] = useState<EmailClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Compose
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk
  const [bulkTemplate, setBulkTemplate] = useState('');
  const [bulkRole, setBulkRole] = useState('Primary');
  const [bulkClients, setBulkClients] = useState<Record<string, boolean>>({});
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scheduler
  const [scheduleTemplate, setScheduleTemplate] = useState('');
  const [scheduleClient, setScheduleClient] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);

  // History
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Email Config (SMTP / OAuth)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'polaris',
    connected: true,
    from_name: 'Polaris Financial Services',
    from_email: 'noreply@polaris-tpa.com',
  });
  const [showConfig, setShowConfig] = useState(false);

  // ═══ Load clients ═══
  useEffect(() => {
    async function loadClients() {
      if (cachedClients) {
        setClients(cachedClients);
        setClientsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/proxy/getClients');
        const data = await res.json();
        if (data.success && data.data) {
          const idToName: Record<string, string> = {};
          data.data.forEach((c: any) => { idToName[c.client_id] = c.client_name; });

          const parents = data.data.filter((c: any) => c.client_type === 'parent').sort((a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''));
          const subs = data.data.filter((c: any) => c.client_type === 'subsidiary');

          const organized: EmailClient[] = [];
          parents.forEach((p: any) => {
            organized.push({
              id: p.client_id, name: p.client_name, isChild: false,
              contact_name: p.contact_name || '', contact_email: p.contact_email || '',
              contact_capacity: p.contact_capacity || '',
            });
            subs.filter((s: any) => s.parent_client_id === p.client_id)
              .sort((a: any, b: any) => (a.client_name || '').localeCompare(b.client_name || ''))
              .forEach((s: any) => {
                organized.push({
                  id: s.client_id, name: s.client_name, isChild: true,
                  contact_name: s.contact_name || '', contact_email: s.contact_email || '',
                  contact_capacity: s.contact_capacity || '',
                });
              });
          });
          // Remaining subs without parent
          subs.filter((s: any) => !organized.find(o => o.id === s.client_id)).forEach((s: any) => {
            organized.push({
              id: s.client_id, name: s.client_name, isChild: true,
              contact_name: s.contact_name || '', contact_email: s.contact_email || '',
              contact_capacity: s.contact_capacity || '',
            });
          });

          cachedClients = organized;
          setClients(organized);
        }
      } catch (err) {
        console.error('Failed to load email clients:', err);
      } finally {
        setClientsLoading(false);
      }
    }
    loadClients();
  }, []);

  // ═══ Load templates from API ═══
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/proxy/getEmailTemplates');
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setTemplates(data.data.map((t: any) => ({
            template_id: t.template_id || t.id,
            template_name: t.template_name || t.name,
            category: t.category || 'other',
            subject: t.subject || '',
            body: t.body || t.html || '',
          })));
        }
      } catch {
        // Keep default templates
      }
    }
    loadTemplates();
  }, []);

  // ═══ Handle template selection ═══
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = templates.find(t => t.template_id === templateId);
    if (tmpl) {
      const client = clients.find(c => c.id === selectedClient);
      const clientName = client?.name || '{{client_name}}';
      setSubject(tmpl.subject.replace(/\{\{client_name\}\}/g, clientName));
    }
  }, [templates, clients, selectedClient]);

  // ═══ Handle client selection — load recipients ═══
  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client && client.contact_email) {
      setRecipients([{
        name: client.contact_name,
        email: client.contact_email,
        role: client.contact_capacity || 'Primary',
        selected: true,
      }]);
    } else {
      setRecipients([]);
    }
    // Update subject with client name
    if (selectedTemplate) {
      const tmpl = templates.find(t => t.template_id === selectedTemplate);
      if (tmpl && client) {
        setSubject(tmpl.subject.replace(/\{\{client_name\}\}/g, client.name));
      }
    }
  }, [clients, selectedTemplate, templates]);

  // ═══ Toggle recipient ═══
  const toggleRecipient = useCallback((email: string) => {
    setRecipients(prev => prev.map(r => r.email === email ? { ...r, selected: !r.selected } : r));
  }, []);

  // ═══ Add additional email ═══
  const addRecipient = useCallback(() => {
    if (!additionalEmail || !additionalEmail.includes('@')) return;
    setRecipients(prev => [...prev, { name: additionalEmail.split('@')[0], email: additionalEmail, role: 'Additional', selected: true }]);
    setAdditionalEmail('');
  }, [additionalEmail]);

  // ═══ Select all / clear recipients ═══
  const selectAllRecipients = useCallback(() => {
    setRecipients(prev => prev.map(r => ({ ...r, selected: true })));
  }, []);

  const clearAllRecipients = useCallback(() => {
    setRecipients(prev => prev.map(r => ({ ...r, selected: false })));
  }, []);

  // ═══ Send email ═══
  const sendEmail = useCallback(async () => {
    const selectedRecipients = recipients.filter(r => r.selected);
    if (!selectedTemplate || !selectedClient || selectedRecipients.length === 0 || !subject) return;

    setSending(true);
    setSendStatus(null);

    try {
      const params = new URLSearchParams({
        action: 'sendEmail',
        templateId: selectedTemplate,
        clientId: selectedClient,
        subject: subject,
        recipients: selectedRecipients.map(r => r.email).join(','),
        sent_by: 'admin',
      });

      // If using custom SMTP, add config
      if (emailConfig.provider !== 'polaris') {
        params.append('smtp_host', emailConfig.smtp_host || '');
        params.append('smtp_port', String(emailConfig.smtp_port || 587));
        params.append('smtp_user', emailConfig.smtp_user || '');
        params.append('from_name', emailConfig.from_name || '');
        params.append('from_email', emailConfig.from_email || '');
      }

      const res = await fetch(`/api/proxy/sendEmail?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setSendStatus({ type: 'success', message: `Email sent successfully to ${selectedRecipients.length} recipient(s)!` });
        // Clear form after 2s
        setTimeout(() => {
          setSelectedTemplate('');
          setSelectedClient('');
          setRecipients([]);
          setSubject('');
          setSendStatus(null);
        }, 3000);
      } else {
        setSendStatus({ type: 'error', message: result.error || 'Failed to send email' });
      }
    } catch (err) {
      setSendStatus({ type: 'error', message: 'Error sending email. Please try again.' });
    } finally {
      setSending(false);
    }
  }, [selectedTemplate, selectedClient, recipients, subject, emailConfig]);

  // ═══ Load history ═══
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/proxy/getEmailHistory');
      const data = await res.json();
      if (data.success && data.data) {
        setHistory(data.data.map((h: any) => ({
          id: h.id || h.email_id || '',
          date: h.sent_date || h.date || '',
          client: h.client_name || h.client || '',
          subject: h.subject || '',
          recipients: h.recipients || '',
          status: h.status || 'sent',
          template: h.template_name || h.template || '',
        })));
      }
    } catch {
      // Empty history
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ═══ Bulk send ═══
  const toggleBulkClient = useCallback((clientId: string) => {
    setBulkClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  }, []);

  const selectAllBulkClients = useCallback(() => {
    const all: Record<string, boolean> = {};
    clients.forEach(c => { all[c.id] = true; });
    setBulkClients(all);
  }, [clients]);

  const clearAllBulkClients = useCallback(() => setBulkClients({}), []);

  const sendBulkEmail = useCallback(async () => {
    const selectedIds = Object.entries(bulkClients).filter(([, v]) => v).map(([k]) => k);
    if (!bulkTemplate || selectedIds.length === 0) return;

    setBulkSending(true);
    setBulkStatus(null);

    try {
      const params = new URLSearchParams({
        action: 'sendBulkEmail',
        templateId: bulkTemplate,
        clientIds: selectedIds.join(','),
        role: bulkRole,
        sent_by: 'admin',
      });

      const res = await fetch(`/api/proxy/sendBulkEmail?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        setBulkStatus({ type: 'success', message: `Bulk email sent to ${result.sent || selectedIds.length} clients!` });
        setBulkClients({});
      } else {
        setBulkStatus({ type: 'error', message: result.error || 'Failed to send bulk email' });
      }
    } catch {
      setBulkStatus({ type: 'error', message: 'Error sending bulk email.' });
    } finally {
      setBulkSending(false);
    }
  }, [bulkTemplate, bulkClients, bulkRole]);

  // ═══ Scheduler ═══
  const addScheduledEmail = useCallback(async () => {
    if (!scheduleTemplate || !scheduleClient || !scheduleDate) return;

    try {
      const params = new URLSearchParams({
        action: 'scheduleEmail',
        templateId: scheduleTemplate,
        clientId: scheduleClient,
        date: scheduleDate,
        time: scheduleTime,
        notes: scheduleNotes,
        sent_by: 'admin',
      });

      const res = await fetch(`/api/proxy/scheduleEmail?${params.toString()}`);
      const result = await res.json();

      if (result.success) {
        // Add to local list
        const tmpl = templates.find(t => t.template_id === scheduleTemplate);
        const client = clients.find(c => c.id === scheduleClient);
        setScheduledEmails(prev => [...prev, {
          id: result.id || Date.now().toString(),
          date: scheduleDate,
          time: scheduleTime,
          client: client?.name || scheduleClient,
          template: tmpl?.template_name || scheduleTemplate,
          role: 'Primary',
          status: 'scheduled',
          notes: scheduleNotes,
        }]);
        setScheduleTemplate('');
        setScheduleClient('');
        setScheduleDate('');
        setScheduleNotes('');
      }
    } catch {
      console.error('Failed to schedule email');
    }
  }, [scheduleTemplate, scheduleClient, scheduleDate, scheduleTime, scheduleNotes, templates, clients]);

  const loadScheduledEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/proxy/getScheduledEmails');
      const data = await res.json();
      if (data.success && data.data) {
        setScheduledEmails(data.data.map((s: any) => ({
          id: s.id || '',
          date: s.date || '',
          time: s.time || '',
          client: s.client_name || s.client || '',
          template: s.template_name || s.template || '',
          role: s.role || 'Primary',
          status: s.status || 'scheduled',
          notes: s.notes || '',
        })));
      }
    } catch {
      // Keep empty
    }
  }, []);

  const deleteScheduledEmail = useCallback(async (id: string) => {
    try {
      await fetch(`/api/proxy/deleteScheduledEmail?id=${id}`);
      setScheduledEmails(prev => prev.filter(s => s.id !== id));
    } catch {
      console.error('Failed to delete scheduled email');
    }
  }, []);

  // ═══ Email config ═══
  const updateEmailConfig = useCallback((config: Partial<EmailConfig>) => {
    setEmailConfig(prev => ({ ...prev, ...config }));
  }, []);

  const testConnection = useCallback(async () => {
    // TODO: API call to test SMTP connection
    updateEmailConfig({ connected: true });
  }, [updateEmailConfig]);

  // ═══ Filtered templates ═══
  const filteredTemplates = templateFilter === 'all'
    ? templates
    : templates.filter(t => t.category === templateFilter);

  // ═══ Bulk count ═══
  const bulkSelectedCount = Object.values(bulkClients).filter(Boolean).length;

  // ═══ Preview text ═══
  const previewText = (() => {
    if (!selectedTemplate) return '';
    const tmpl = templates.find(t => t.template_id === selectedTemplate);
    const client = clients.find(c => c.id === selectedClient);
    const clientName = client?.name || '{{client_name}}';
    const contactName = client?.contact_name || '{{contact_name}}';

    if (tmpl?.body) return tmpl.body.replace(/\{\{client_name\}\}/g, clientName).replace(/\{\{contact_name\}\}/g, contactName);

    // Default preview per template
    const previews: Record<string, string> = {
      'contract_01': `Dear ${contactName},\n\nPlease find attached your Polaris Health Insurance Contract documents for ${clientName}.\n\nKindly review and sign at your earliest convenience.\n\nBest regards,\nPolaris Financial Services`,
      'welcome_01': `Dear ${contactName},\n\nWelcome to Polaris Financial Services! We are delighted to have ${clientName} as our valued client.\n\nYour dedicated account manager will contact you shortly to discuss your health insurance coverage.\n\nBest regards,\nPolaris Team`,
      'meeting_01': `Dear ${contactName},\n\nThank you for taking the time to meet with us. We enjoyed discussing the needs of ${clientName}.\n\nAs discussed, we will prepare a detailed proposal and follow up within the next few days.\n\nBest regards,\nPolaris Team`,
      'renewal_01': `Dear ${contactName},\n\nThis is a friendly reminder that the health insurance contract for ${clientName} is approaching its renewal date.\n\nPlease contact us to discuss renewal terms and any adjustments needed.\n\nBest regards,\nPolaris Financial Services`,
      'balance_01': `Dear ${contactName},\n\nWe would like to bring to your attention that ${clientName} has an outstanding balance on the account.\n\nKindly arrange payment at your earliest convenience.\n\nBest regards,\nPolaris Accounts Team`,
      'revolving_01': `Dear ${contactName},\n\nURGENT: The revolving fund for ${clientName} has fallen below 50% of the required threshold.\n\nImmediate replenishment is required to ensure uninterrupted coverage.\n\nBest regards,\nPolaris Financial Services`,
      'wishes_01': `Dear ${contactName},\n\nSeason's Greetings from the entire Polaris team!\n\nWe wish you and everyone at ${clientName} a wonderful holiday season.\n\nWarm regards,\nPolaris Financial Services`,
      'wishes_02': `Dear ${contactName},\n\nHappy Easter from Polaris Financial Services!\n\nWe wish you and the team at ${clientName} a joyful celebration.\n\nBest wishes,\nPolaris Team`,
      'wishes_03': `Dear ${contactName},\n\nHappy Birthday! The Polaris team wishes you a wonderful day.\n\nBest wishes,\nPolaris Financial Services`,
    };
    return previews[selectedTemplate] || `Dear ${contactName},\n\nThank you for your continued partnership with Polaris.\n\nBest regards,\nPolaris Team`;
  })();

  // ═══ Can send ═══
  const canSend = selectedTemplate && selectedClient && subject && recipients.some(r => r.selected) && !sending;
  const canBulkSend = bulkTemplate && bulkSelectedCount > 0 && !bulkSending;

  return {
    // Tab
    activeTab, setActiveTab,
    // Templates
    templates, filteredTemplates, templateFilter, setTemplateFilter,
    // Clients
    clients, clientsLoading,
    // Compose
    selectedTemplate, handleTemplateChange,
    selectedClient, handleClientChange,
    recipients, toggleRecipient, selectAllRecipients, clearAllRecipients,
    subject, setSubject,
    additionalEmail, setAdditionalEmail, addRecipient,
    previewText,
    sending, sendEmail, sendStatus, canSend,
    // History
    history, historyLoading, loadHistory,
    // Bulk
    bulkTemplate, setBulkTemplate, bulkRole, setBulkRole,
    bulkClients, toggleBulkClient, selectAllBulkClients, clearAllBulkClients,
    bulkSelectedCount, bulkSending, sendBulkEmail, bulkStatus, canBulkSend,
    // Scheduler
    scheduleTemplate, setScheduleTemplate,
    scheduleClient, setScheduleClient,
    scheduleDate, setScheduleDate,
    scheduleTime, setScheduleTime,
    scheduleNotes, setScheduleNotes,
    scheduledEmails, addScheduledEmail, loadScheduledEmails, deleteScheduledEmail,
    // Config
    emailConfig, updateEmailConfig, testConnection, showConfig, setShowConfig,
  };
}
