'use client';
import { useState, useCallback, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */
export interface SendDocsOffer {
  offerId: string;
  clientId: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  programs: string[];
  items?: any[];
  status: string;
  totalMembers?: number;
  grandTotal?: number;
  isComparison?: boolean;
  offer?: any;
}

export interface Recipient {
  name: string;
  email: string;
  role: string;
  checked: boolean;
}

export interface DocCheckbox {
  key: string;
  value: string;
  label: string;
  icon: string;
  desc: string;
  fileId?: string;
  fileUrl?: string;
  available?: boolean;
  version?: number;
}

export interface ProgramBrochure {
  name: string;
  icon: string;
  limit: string;
  checked: boolean;
  highlighted: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body_html?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */
export const PROGRAM_FILE_IDS: Record<string, string> = {
  'Silver': '19wzlaTn_qhx72JY5w94xmN93wKCCGy19',
  'Gold': '1qsYOCSbYJw3UyioUqBdhbAxqgxCIpk1c',
  'Gold+': '19uDXnW5Z-abm-En10UVSibyXDBuLJgtC',
  'Gold++': '1azzhFBt4xpSRljWFMjV5Y-6El4pGlf8r',
  'Platinum': '1apl63zK-UVdG-JU87VbeffVupPlTXUFp',
  'Diamond': '1pZVOjPAN-Fni4yMUlum2NVBSyy-eay-4',
  'Dental': '1xjaHu2vn2f3uOTha1O97w7EyNkSoPsXu'
};

const SIGNATORY_FILE_IDS: Record<string, string> = {
  'apostolos_kagelaris': '1apoOaPtvftYKN1yG_t_ysTfr0mfwx7ky'
};

const INITIAL_DOCS: DocCheckbox[] = [
  { key: 'doc_nda', value: 'NDA', label: '🔒 NDA', icon: '🔒', desc: 'Non-Disclosure Agreement' },
  { key: 'doc_dpa', value: 'DPA', label: '🛡️ DPA', icon: '🛡️', desc: 'Data Processing Agreement' },
  { key: 'doc_asa', value: 'ASA', label: '📋 ASA', icon: '📋', desc: 'Administrative Services Agreement' },
  { key: 'doc_proposal', value: 'PROPOSAL', label: '💼 Proposal', icon: '💼', desc: 'Healthcare TPA Services Proposal' },
];

const CQ_DOC: DocCheckbox = {
  key: 'doc_comparison_quote', value: 'COMPARISON_QUOTE', label: '📊 Comparison Quote', icon: '📊', desc: 'Multi-plan comparison document'
};

const INITIAL_PROGRAMS: ProgramBrochure[] = [
  { name: 'Silver', icon: '🥈', limit: '40K / 20K', checked: false, highlighted: false },
  { name: 'Gold', icon: '🥇', limit: '80K / 40K', checked: false, highlighted: false },
  { name: 'Gold+', icon: '🥇+', limit: '100K / 40K', checked: false, highlighted: false },
  { name: 'Gold++', icon: '🥇++', limit: '150K / 50K', checked: false, highlighted: false },
  { name: 'Platinum', icon: '💎', limit: '180K / 40K', checked: false, highlighted: false },
  { name: 'Diamond', icon: '💠', limit: '360K / 60K', checked: false, highlighted: false },
  { name: 'Dental', icon: '🦷', limit: 'Add-on', checked: false, highlighted: false },
];

/* ═══════════════════════════════════════════════════════════════════
   Local email templates (fallback)
   ═══════════════════════════════════════════════════════════════════ */
const LOCAL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  'initial_contact': {
    subject: 'Non-Disclosure Agreement - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>Thank you for your interest in <strong>Polaris Financial Services</strong> healthcare solutions for your seafarers.</p>
      <p>As a first step in our partnership discussions, please find attached our <strong>Non-Disclosure Agreement (NDA)</strong>.</p>
      <p>Once signed and returned, we will be able to share:</p>
      <ul>
        <li>Detailed program information and coverage options</li>
        <li>Customized pricing tailored to {{client_name}}'s specific needs</li>
        <li>Our comprehensive healthcare proposal</li>
      </ul>
      <p>Please review the NDA at your earliest convenience.</p>
      <p>We look forward to the opportunity of working with {{client_name}}.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'proposal_submission': {
    subject: 'Healthcare TPA Proposal - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>Following our recent discussions, we are pleased to present our comprehensive <strong>Healthcare TPA Proposal</strong> for {{client_name}}.</p>
      <p>The attached proposal includes:</p>
      <ul>
        <li>Detailed coverage options and benefit structures</li>
        <li>Competitive pricing based on your specific requirements</li>
        <li>Program comparisons to help you select the best fit</li>
        <li>Implementation timeline and onboarding process</li>
      </ul>
      <p>We would welcome the opportunity to discuss the proposal in detail.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'contract_documents': {
    subject: 'Contract Documents - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>We are delighted to move forward with {{client_name}}'s enrollment in our healthcare program.</p>
      <p>Please find attached the following contract documents:</p>
      <ul>
        <li><strong>Data Processing Agreement (DPA)</strong> - GDPR compliance</li>
        <li><strong>Administrative Services Agreement (ASA)</strong> - Main service contract</li>
      </ul>
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Review both documents carefully</li>
        <li>Sign where indicated</li>
        <li>Return the signed copies to us</li>
        <li>We will countersign and return your copies</li>
      </ol>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'program_info': {
    subject: 'Healthcare Program Information - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>As requested, please find attached detailed brochures for the healthcare programs we discussed.</p>
      <p>Our programs are designed specifically for the maritime industry, providing comprehensive coverage for seafarers and their dependents.</p>
      <p>If you would like to discuss which program best suits {{client_name}}'s needs, please don't hesitate to contact us.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'full_package': {
    subject: 'Complete Document Package - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>Please find attached a complete package of documents for {{client_name}}:</p>
      <h4 style="color: #1e3a5f;">📄 Contract Documents:</h4>
      <ul>
        <li><strong>Non-Disclosure Agreement (NDA)</strong></li>
        <li><strong>Data Processing Agreement (DPA)</strong></li>
        <li><strong>Administrative Services Agreement (ASA)</strong></li>
        <li><strong>Healthcare TPA Proposal</strong></li>
      </ul>
      <h4 style="color: #1e3a5f;">📋 Program Brochures:</h4>
      <ul><li>Detailed coverage information for selected programs</li></ul>
      <p>We recommend reviewing each document carefully.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'followup_nda': {
    subject: 'Follow-up: NDA for {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>I wanted to follow up on the <strong>Non-Disclosure Agreement</strong> we sent previously for {{client_name}}.</p>
      <p>Once we receive the signed NDA, we will be able to share our detailed healthcare proposal with customized pricing.</p>
      <p>If you have any questions about the NDA, please let me know.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'followup_proposal': {
    subject: 'Follow-up: Proposal Review - {{client_name}}',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>I wanted to check in regarding the healthcare proposal we submitted for {{client_name}}.</p>
      <p>Have you had a chance to review the coverage options and pricing? I would be happy to schedule a call to discuss any questions.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
  'followup_decision': {
    subject: 'Following Up - {{client_name}} Healthcare Program',
    body: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear {{contact_name}},</p>
      <p>I'm following up on our healthcare proposal for {{client_name}}.</p>
      <p>Is there any additional information you need to help with your decision? We're committed to providing the best solution for your team.</p>
      <br><p>Best regards,</p>
      <p><strong>✦ POLARIS Financial Services</strong><br>Healthcare Solutions for the Maritime Industry</p>
    </div>`
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Helper
   ═══════════════════════════════════════════════════════════════════ */
function replacePlaceholders(text: string, clientName: string, contactName: string): string {
  const firstName = contactName.split(' ')[0] || contactName;
  return text
    .replace(/\{\{client_name\}\}/gi, clientName)
    .replace(/\{\{contact_name\}\}/gi, firstName)
    .replace(/\{\{contact_full_name\}\}/gi, contactName)
    .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
    .replace(/\{\{year\}\}/gi, new Date().getFullYear().toString())
    .replace(/\{\{company_name\}\}/gi, clientName)
    .replace(/\{\{sender_name\}\}/gi, 'Polaris Financial Services')
    .replace(/\{\{sender_title\}\}/gi, 'Business Development')
    .replace(/\{\{sender_email\}\}/gi, 'info@polarisfinancial.com');
}

/* ═══════════════════════════════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════════════════════════════ */
export function useSendDocuments() {
  // ── Core state ──
  const [isOpen, setIsOpen] = useState(false);
  const [offer, setOffer] = useState<SendDocsOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | 'loading' } | null>(null);

  // ── Client search (when no offer context) ──
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [showClientSearch, setShowClientSearch] = useState(true);
  const [clientOffers, setClientOffers] = useState<any[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // ── Documents ──
  const [docs, setDocs] = useState<DocCheckbox[]>([...INITIAL_DOCS]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [showCQ, setShowCQ] = useState(false);
  const [cqChecked, setCqChecked] = useState(false);

  // ── Programs ──
  const [programs, setPrograms] = useState<ProgramBrochure[]>(INITIAL_PROGRAMS.map(p => ({ ...p })));

  // ── Format & Status ──
  const [docFormat, setDocFormat] = useState<'word' | 'pdf'>('word');
  const [newStatus, setNewStatus] = useState('');

  // ── Signature ──
  const [signDocs, setSignDocs] = useState(false);
  const [signatory, setSignatory] = useState('');

  // ── Email Template ──
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState('');

  // ── Recipients ──
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // ── Local files ──
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  // ── Cached clients ──
  const clientsCacheRef = useRef<any[]>([]);

  /* ─── Computed ─── */
  const attachmentCount = Object.values(checkedDocs).filter(Boolean).length
    + (cqChecked ? 1 : 0)
    + programs.filter(p => p.checked).length
    + localFiles.length;

  const checkedRecipients = recipients.filter(r => r.checked);

  const canSend = !!offer && checkedRecipients.length > 0 && selectedTemplate !== '' && attachmentCount > 0;

  /* ─── Open modal ─── */
  const openModal = useCallback(async (offerData: SendDocsOffer | null) => {
    // Reset everything
    setCheckedDocs({});
    setCqChecked(false);
    setPrograms(INITIAL_PROGRAMS.map(p => ({ ...p })));
    setDocFormat('word');
    setNewStatus('');
    setSignDocs(false);
    setSignatory('');
    setSelectedTemplate('');
    setEmailBody('');
    setOriginalTemplate('');
    setRecipients([]);
    setLocalFiles([]);
    setStatus(null);
    setClientSearch('');
    setClientResults([]);
    setClientOffers([]);
    setSelectedOfferId(null);

    if (offerData) {
      setOffer(offerData);
      setShowClientSearch(false);
      setShowCQ(!!offerData.isComparison);
      if (offerData.isComparison) setCqChecked(true);

      // Highlight programs from offer
      if (offerData.programs && offerData.programs.length > 0) {
        setPrograms(prev => prev.map(p => {
          const match = offerData.programs.some(op =>
            op.toLowerCase().replace(/\s+/g, '') === p.name.toLowerCase().replace(/\s+/g, '') ||
            (op.toLowerCase().includes('dental') && p.name === 'Dental')
          );
          return { ...p, checked: match, highlighted: match };
        }));
      }

      // Load recipients
      await loadRecipients(offerData.clientId, offerData.contactName, offerData.contactEmail);

      // Load generated docs
      await loadOfferDocs(offerData.offerId);
    } else {
      setOffer(null);
      setShowClientSearch(true);
      setShowCQ(false);
    }

    // Load templates
    loadTemplates();
    setIsOpen(true);
  }, []);

  /* ─── Close modal ─── */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setOffer(null);
  }, []);

  /* ─── Client search ─── */
  const searchClients = useCallback(async (query: string) => {
    setClientSearch(query);
    if (query.length < 2) { setClientResults([]); return; }

    try {
      if (clientsCacheRef.current.length === 0) {
        const res = await fetch('/api/proxy/getClients');
        const data = await res.json();
        if (data.success && data.data) clientsCacheRef.current = data.data;
      }
      const filtered = clientsCacheRef.current.filter((c: any) => {
        const name = (c.client_name || '').toLowerCase();
        const contact = (c.contact_name || '').toLowerCase();
        return name.includes(query.toLowerCase()) || contact.includes(query.toLowerCase());
      }).slice(0, 8);
      setClientResults(filtered);
    } catch (e) { console.error('Client search error:', e); }
  }, []);

  const selectClient = useCallback(async (client: any) => {
    const offerData: SendDocsOffer = {
      offerId: '',
      clientId: client.client_id,
      clientName: client.client_name || 'Unknown',
      contactName: client.contact_name || client.contact_person || 'Primary Contact',
      contactEmail: client.contact_email || client.email || '',
      programs: [],
      status: '',
    };
    setOffer(offerData);
    setShowClientSearch(false);
    setClientSearch('');
    setClientResults([]);

    // Load recipients
    await loadRecipients(client.client_id, offerData.contactName, offerData.contactEmail);

    // Load client offers
    await loadClientOffers(client.client_id, client.client_name);
  }, []);

  const clearClient = useCallback(() => {
    setOffer(null);
    setShowClientSearch(true);
    setClientOffers([]);
    setSelectedOfferId(null);
    setRecipients([]);
    setCheckedDocs({});
    setCqChecked(false);
    setPrograms(INITIAL_PROGRAMS.map(p => ({ ...p })));
  }, []);

  /* ─── Load client offers ─── */
  const loadClientOffers = useCallback(async (clientId: string, clientName: string) => {
    try {
      const res = await fetch('/api/proxy/getOffers');
      const data = await res.json();
      if (data.success && data.data) {
        const filtered = data.data
          .filter((o: any) => o.client_id === clientId || o.client_name?.toLowerCase() === clientName?.toLowerCase())
          .sort((a: any, b: any) => new Date(b.created_at || b.date_created || 0).getTime() - new Date(a.created_at || a.date_created || 0).getTime())
          .slice(0, 10);
        setClientOffers(filtered);
      }
    } catch (e) { console.error('Load offers error:', e); }
  }, []);

  /* ─── Select offer from list ─── */
  const selectOffer = useCallback(async (offerId: string, offerObj: any) => {
    setSelectedOfferId(offerId);

    // Clear previous selections
    setCheckedDocs({});
    setCqChecked(false);
    setPrograms(INITIAL_PROGRAMS.map(p => ({ ...p })));

    const isComparison = offerObj.offer_type === 'comparison' || offerId.startsWith('CQ-');
    setShowCQ(isComparison);
    if (isComparison) setCqChecked(true);

    // Update offer data
    setOffer(prev => prev ? {
      ...prev,
      offerId,
      offer: offerObj,
      isComparison,
      totalMembers: offerObj.total_members,
      grandTotal: offerObj.grand_total_usd,
      status: offerObj.status,
    } : null);

    // Highlight programs
    const offerPrograms = extractPrograms(offerObj, isComparison);
    setPrograms(prev => prev.map(p => {
      const match = offerPrograms.some((op: string) =>
        op.toLowerCase().replace(/\s+/g, '') === p.name.toLowerCase().replace(/\s+/g, '') ||
        (op.toLowerCase().includes('dental') && p.name === 'Dental')
      );
      return { ...p, checked: match, highlighted: match };
    }));

    // Load generated docs
    await loadOfferDocs(offerId);
  }, []);

  /* ─── Extract programs from offer ─── */
  function extractPrograms(offerObj: any, isComparison: boolean): string[] {
    const progs: string[] = [];
    try {
      if (isComparison && offerObj.comparison_data) {
        let compData = offerObj.comparison_data;
        if (typeof compData === 'string' && compData.startsWith('[')) {
          compData = JSON.parse(compData);
        }
        if (Array.isArray(compData)) {
          compData.forEach((opt: any) => {
            const planName = opt.planName || opt.plan_name || opt.plan || '';
            if (planName && !progs.includes(planName)) progs.push(planName);
            if (opt.hasDental && !progs.includes('Dental')) progs.push('Dental');
          });
        }
      }
      if (progs.length === 0 && offerObj.items) {
        const items = typeof offerObj.items === 'string' ? JSON.parse(offerObj.items) : offerObj.items;
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const name = item.plan_name || item.program || '';
            if (name && !progs.includes(name)) progs.push(name);
          });
        }
      }
    } catch (e) { console.error('extractPrograms error:', e); }

    // Dental flag
    if ((offerObj.includes_dental === true || offerObj.includes_dental === 'true') && !progs.some(p => p.toLowerCase().includes('dental'))) {
      progs.push('Dental');
    }
    return progs;
  }

  /* ─── Load generated docs for offer ─── */
  const loadOfferDocs = useCallback(async (offerId: string) => {
    if (!offerId) return;
    try {
      const res = await fetch('/api/proxy/getAllOffersDocuments');
      const data = await res.json();
      if (data.success && data.data && data.data[offerId]) {
        const offerDocs = data.data[offerId];
        const getUrl = (doc: any) => {
          if (!doc) return null;
          if (typeof doc === 'string') return doc;
          return doc.url || doc.drive_url || doc.fileUrl || null;
        };

        const newChecked: Record<string, boolean> = {};
        const updatedDocs = [...INITIAL_DOCS];

        ['nda', 'dpa', 'asa', 'proposal'].forEach((key, idx) => {
          const url = getUrl(offerDocs[key]);
          if (url) {
            newChecked[updatedDocs[idx].value] = true;
            updatedDocs[idx] = {
              ...updatedDocs[idx],
              available: true,
              fileId: offerDocs[key]?.fileId,
              fileUrl: url,
              version: offerDocs[key]?.version || 1,
            };
          }
        });

        setDocs(updatedDocs);
        setCheckedDocs(newChecked);
      }
    } catch (e) { console.error('Load docs error:', e); }
  }, []);

  /* ─── Load recipients ─── */
  const loadRecipients = useCallback(async (clientId: string, contactName: string, contactEmail: string) => {
    const list: Recipient[] = [];
    if (contactEmail) {
      list.push({ name: contactName || 'Primary Contact', email: contactEmail, role: 'Primary', checked: true });
    }
    try {
      const res = await fetch(`/api/proxy/getClientContacts?clientId=${clientId}`);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data)) {
        data.data.forEach((c: any) => {
          const email = c.email || c.contact_email;
          if (email && !list.some(r => r.email === email)) {
            list.push({ name: c.name || c.contact_name || 'Contact', email, role: c.role || 'Contact', checked: true });
          }
        });
      }
    } catch (e) { console.error('Load recipients error:', e); }

    // Fallback — if no contacts from API, try client data
    if (list.length === 0 && contactEmail) {
      list.push({ name: contactName, email: contactEmail, role: 'Primary', checked: true });
    }
    setRecipients(list);
  }, []);

  /* ─── Toggle recipient ─── */
  const toggleRecipient = useCallback((idx: number) => {
    setRecipients(prev => prev.map((r, i) => i === idx ? { ...r, checked: !r.checked } : r));
  }, []);

  const selectRecipientsByRole = useCallback((role: string) => {
    if (role === 'all') {
      setRecipients(prev => prev.map(r => ({ ...r, checked: true })));
    } else if (role === 'clear') {
      setRecipients(prev => prev.map(r => ({ ...r, checked: false })));
    } else {
      setRecipients(prev => prev.map(r => r.role.toLowerCase().includes(role.toLowerCase()) ? { ...r, checked: true } : r));
    }
  }, []);

  /* ─── Toggle doc checkbox ─── */
  const toggleDoc = useCallback((value: string) => {
    setCheckedDocs(prev => ({ ...prev, [value]: !prev[value] }));
  }, []);

  /* ─── Toggle program ─── */
  const toggleProgram = useCallback((idx: number) => {
    setPrograms(prev => prev.map((p, i) => i === idx ? { ...p, checked: !p.checked } : p));
  }, []);

  /* ─── Load templates ─── */
  const loadTemplates = useCallback(async () => {
    // Use local templates as options
    const localList: EmailTemplate[] = [
      { id: 'initial_contact', name: 'Initial Contact (NDA)', category: 'Document Delivery' },
      { id: 'proposal_submission', name: 'Proposal Submission', category: 'Document Delivery' },
      { id: 'contract_documents', name: 'Contract Documents (DPA + ASA)', category: 'Document Delivery' },
      { id: 'program_info', name: 'Program Information Only', category: 'Document Delivery' },
      { id: 'full_package', name: 'Full Package Delivery', category: 'Document Delivery' },
      { id: 'followup_nda', name: 'Follow-up: NDA Signed?', category: 'Follow-up' },
      { id: 'followup_proposal', name: 'Follow-up: Proposal Review', category: 'Follow-up' },
      { id: 'followup_decision', name: 'Follow-up: Decision Pending', category: 'Follow-up' },
    ];

    // Also try to load from API
    try {
      const res = await fetch('/api/proxy/getEmailTemplates');
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data)) {
        data.data.forEach((t: any) => {
          if (!localList.some(l => l.id === t.template_id)) {
            localList.push({ id: t.template_id, name: t.name || t.template_id, category: t.category || 'Other' });
          }
        });
      }
    } catch (e) { /* use local templates */ }

    setTemplates(localList);
  }, []);

  /* ─── Select template ─── */
  const selectTemplate = useCallback(async (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      setEmailBody('');
      setOriginalTemplate('');
      return;
    }

    const clientName = offer?.clientName || '{{client_name}}';
    const contactName = offer?.contactName || '{{contact_name}}';

    // Try API first
    try {
      const res = await fetch(`/api/proxy/getEmailTemplateBody?template_id=${templateId}`);
      const data = await res.json();
      if (data.success && data.body_html) {
        const body = replacePlaceholders(data.body_html, clientName, contactName);
        setEmailBody(body);
        setOriginalTemplate(body);
        return;
      }
    } catch (e) { /* fallback to local */ }

    // Local template
    const local = LOCAL_TEMPLATES[templateId];
    if (local) {
      const body = replacePlaceholders(local.body, clientName, contactName);
      setEmailBody(body);
      setOriginalTemplate(body);
    }
  }, [offer]);

  /* ─── Reset template ─── */
  const resetTemplate = useCallback(() => {
    if (originalTemplate) setEmailBody(originalTemplate);
  }, [originalTemplate]);

  /* ─── Submit (send) ─── */
  const submitSend = useCallback(async () => {
    if (!offer) return;
    setStatus({ msg: '📨 Preparing documents and sending...', type: 'loading' });
    setLoading(true);

    const selectedDocs = Object.entries(checkedDocs).filter(([, v]) => v).map(([k]) => k);
    if (cqChecked) selectedDocs.push('COMPARISON_QUOTE');
    const selectedProgs = programs.filter(p => p.checked).map(p => p.name);

    try {
      const res = await fetch('/api/proxy/sendDocumentsEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendDocumentsEmail',
          clientId: offer.clientId,
          clientName: offer.clientName,
          recipients: checkedRecipients.map(r => ({ name: r.name, email: r.email })),
          documents: selectedDocs,
          programs: selectedProgs,
          emailBody,
          template: selectedTemplate,
          signDocs,
          signatory,
          documentFormat: docFormat,
          newStatus,
          offerId: offer.offerId,
          signatureFileId: signDocs && signatory ? SIGNATORY_FILE_IDS[signatory] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ msg: '✅ Documents sent successfully to ' + checkedRecipients.map(r => r.email).join(', '), type: 'success' });
        setTimeout(() => closeModal(), 3000);
      } else {
        setStatus({ msg: '❌ ' + (data.error || 'Failed to send'), type: 'error' });
      }
    } catch (e: any) {
      setStatus({ msg: '❌ Error: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [offer, checkedDocs, cqChecked, programs, emailBody, selectedTemplate, signDocs, signatory, docFormat, newStatus, checkedRecipients, closeModal]);

  /* ─── Save draft ─── */
  const saveDraft = useCallback(async () => {
    if (!offer) { setStatus({ msg: '❌ Please select a client first.', type: 'error' }); return; }
    if (checkedRecipients.length === 0) { setStatus({ msg: '❌ Please select at least one recipient.', type: 'error' }); return; }

    setStatus({ msg: '💾 Saving draft to Gmail...', type: 'loading' });
    setLoading(true);

    const selectedDocs = Object.entries(checkedDocs).filter(([, v]) => v).map(([k]) => k);
    const selectedProgs = programs.filter(p => p.checked).map(p => p.name);

    try {
      const res = await fetch('/api/proxy/createEmailDraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createEmailDraft',
          clientId: offer.clientId,
          clientName: offer.clientName,
          recipients: checkedRecipients.map(r => ({ name: r.name, email: r.email })),
          documents: selectedDocs,
          programs: selectedProgs,
          emailBody,
          template: selectedTemplate,
          signDocs,
          signatory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ msg: '✅ Draft saved to Gmail! Check your drafts folder.', type: 'success' });
      } else {
        setStatus({ msg: '❌ ' + (data.error || 'Failed to save draft'), type: 'error' });
      }
    } catch (e: any) {
      setStatus({ msg: '❌ Error: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [offer, checkedDocs, programs, emailBody, selectedTemplate, signDocs, signatory, checkedRecipients]);

  return {
    // State
    isOpen, offer, loading, status,
    clientSearch, clientResults, showClientSearch, clientOffers, selectedOfferId,
    docs, checkedDocs, showCQ, cqChecked,
    programs,
    docFormat, newStatus,
    signDocs, signatory,
    templates, selectedTemplate, emailBody,
    recipients,
    localFiles,
    attachmentCount, canSend, checkedRecipients,
    // Actions
    openModal, closeModal,
    searchClients, selectClient, clearClient,
    selectOffer,
    toggleDoc, setCqChecked,
    toggleProgram,
    setDocFormat, setNewStatus,
    setSignDocs, setSignatory,
    selectTemplate, setEmailBody, resetTemplate,
    toggleRecipient, selectRecipientsByRole,
    setLocalFiles,
    submitSend, saveDraft,
    setStatus,
  };
}
