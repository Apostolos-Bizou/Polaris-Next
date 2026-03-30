'use client';
import { useState, useCallback, useEffect } from 'react';

// ═══ Types ═══
export interface ReportSection {
  key: string;
  title: string;
  icon: string;
  desc: string;
  pages: string;
  checked: boolean;
}

export interface ReportTemplate {
  key: string;
  icon: string;
  label: string;
  sections: string[];
}

export interface GeneratedReport {
  id: string;
  title: string;
  client: string;
  period: string;
  format: string;
  sections: number;
  date: string;
  status: 'completed' | 'generating' | 'failed';
}

// ═══ Constants ═══
const TEMPLATES: ReportTemplate[] = [
  { key: 'board', icon: '\uD83C\uDFAF', label: 'Board Meeting', sections: ['executive', 'inout', 'claims', 'cost'] },
  { key: 'monthly', icon: '\uD83D\uDCC8', label: 'Monthly Review', sections: ['executive', 'inout', 'claims', 'cost', 'members', 'movement'] },
  { key: 'executive', icon: '\u26A1', label: 'Executive Summary', sections: ['executive', 'cost'] },
  { key: 'full', icon: '\uD83D\uDCCA', label: 'Full Report', sections: ['executive', 'inout', 'claims', 'cost', 'members', 'movement', 'plans', 'history', 'trends'] },
];

const DEFAULT_SECTIONS: ReportSection[] = [
  { key: 'executive', title: 'Executive Summary', icon: '\uD83D\uDCCB', desc: 'KPI overview and highlights', pages: '1 page', checked: true },
  { key: 'inout', title: 'Inpatient vs Outpatient', icon: '\uD83C\uDFE5', desc: 'Case analysis and costs', pages: '1 page', checked: true },
  { key: 'claims', title: 'Claims Analysis', icon: '\uD83D\uDCCB', desc: 'Detailed claims breakdown', pages: '1 page', checked: true },
  { key: 'cost', title: 'Cost Breakdown', icon: '\uD83D\uDCB0', desc: 'Cost analysis by category', pages: '1 page', checked: true },
  { key: 'members', title: 'Principal vs Dependent', icon: '\uD83D\uDC65', desc: 'Member type analysis', pages: '1 page', checked: false },
  { key: 'movement', title: 'Member Movement', icon: '\uD83D\uDCC8', desc: 'Enrollments, cancellations, changes', pages: '1 page', checked: false },
  { key: 'plans', title: 'Plan Performance', icon: '\uD83C\uDFC6', desc: 'Performance by plan type', pages: '1 page', checked: false },
  { key: 'history', title: 'Historical Data', icon: '\uD83D\uDCC5', desc: 'Historical data tables', pages: '2-3 pages', checked: false },
  { key: 'trends', title: 'Trends & Charts', icon: '\uD83D\uDCCA', desc: 'Charts and trend lines', pages: '2 pages', checked: false },
];

// ═══ Hook ═══
export function useReports() {
  // Client selection
  const [clients, setClients] = useState<Array<{id: string; name: string; isChild: boolean}>>([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [clientsLoading, setClientsLoading] = useState(true);

  // Period
  const [fromPeriod, setFromPeriod] = useState('2025-Q3');
  const [toPeriod, setToPeriod] = useState('2025-Q3');
  const [year, setYear] = useState('2025');

  // Template & Sections
  const [activeTemplate, setActiveTemplate] = useState('');
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS.map(s => ({...s})));
  const [format, setFormat] = useState<'pdf' | 'excel' | 'both'>('pdf');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');

  // Report history
  const [history, setHistory] = useState<GeneratedReport[]>([
    { id: 'RPT-001', title: 'Board Meeting Report - Q3 2025', client: 'All Clients', period: 'Q3 2025', format: 'PDF', sections: 4, date: '2025-09-15', status: 'completed' },
    { id: 'RPT-002', title: 'Monthly Review - August 2025', client: 'CENTROFIN', period: 'Q3 2025', format: 'PDF + Excel', sections: 6, date: '2025-08-31', status: 'completed' },
    { id: 'RPT-003', title: 'Executive Summary - H1 2025', client: 'All Clients', period: 'Q1-Q2 2025', format: 'PDF', sections: 2, date: '2025-07-01', status: 'completed' },
    { id: 'RPT-004', title: 'Full Annual Report 2024', client: 'ELETSON', period: 'Full Year 2024', format: 'PDF + Excel', sections: 9, date: '2025-01-15', status: 'completed' },
    { id: 'RPT-005', title: 'Cost Analysis - Q2 2025', client: 'DIANA SHIPPING', period: 'Q2 2025', format: 'Excel', sections: 3, date: '2025-06-30', status: 'completed' },
  ]);

  // Tab
  const [activeTab, setActiveTab] = useState<'builder' | 'history' | 'scheduled'>('builder');

  // Load clients
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/proxy/getClients');
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          const parsed = data.data.map((c: any) => ({
            id: c.client_id,
            name: c.client_name,
            isChild: c.client_type === 'subsidiary',
          })).sort((a: any, b: any) => a.name.localeCompare(b.name));
          setClients(parsed);
        }
      } catch (e) { console.error('Failed to load clients:', e); }
      setClientsLoading(false);
    };
    load();
  }, []);

  // Select template
  const selectTemplate = useCallback((key: string) => {
    setActiveTemplate(key);
    const tmpl = TEMPLATES.find(t => t.key === key);
    if (tmpl) {
      setSections(prev => prev.map(s => ({ ...s, checked: tmpl.sections.includes(s.key) })));
    }
  }, []);

  // Toggle section
  const toggleSection = useCallback((key: string) => {
    setSections(prev => prev.map(s => s.key === key ? { ...s, checked: !s.checked } : s));
    setActiveTemplate('');
  }, []);

  // Select all / none
  const selectAllSections = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, checked: true })));
    setActiveTemplate('full');
  }, []);

  const clearAllSections = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, checked: false })));
    setActiveTemplate('');
  }, []);

  // Generate report
  const generateReport = useCallback(async () => {
    const selected = sections.filter(s => s.checked);
    if (selected.length === 0) { alert('Please select at least one section'); return; }

    setGenerating(true);
    setProgress(0);

    const steps = [
      'Loading client data...',
      'Fetching KPI summary...',
      'Processing claims data...',
      'Generating charts...',
      'Building report layout...',
      'Finalizing document...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressStep(steps[i]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(r => setTimeout(r, 600));
    }

    // Add to history
    const clientName = selectedClient === 'all' ? 'All Clients' : (clients.find(c => c.id === selectedClient)?.name || selectedClient);
    const newReport: GeneratedReport = {
      id: `RPT-${String(history.length + 1).padStart(3, '0')}`,
      title: `${activeTemplate ? TEMPLATES.find(t => t.key === activeTemplate)?.label : 'Custom Report'} - ${fromPeriod}`,
      client: clientName,
      period: fromPeriod === toPeriod ? fromPeriod : `${fromPeriod} to ${toPeriod}`,
      format: format === 'both' ? 'PDF + Excel' : format.toUpperCase(),
      sections: selected.length,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    setHistory(prev => [newReport, ...prev]);
    setGenerating(false);
    setProgress(100);
    setProgressStep('Report generated successfully!');
    setTimeout(() => { setProgress(0); setProgressStep(''); }, 3000);
  }, [sections, selectedClient, clients, fromPeriod, toPeriod, format, activeTemplate, history.length]);

  // Derived
  const selectedCount = sections.filter(s => s.checked).length;
  const estimatedPages = sections.filter(s => s.checked).reduce((sum, s) => {
    const p = parseInt(s.pages) || 1;
    return sum + p;
  }, 1); // +1 for cover

  return {
    // Clients
    clients, selectedClient, setSelectedClient, clientsLoading,
    // Period
    fromPeriod, setFromPeriod, toPeriod, setToPeriod, year, setYear,
    // Template & Sections
    templates: TEMPLATES, activeTemplate, selectTemplate,
    sections, toggleSection, selectAllSections, clearAllSections,
    format, setFormat,
    // Generation
    generating, progress, progressStep, generateReport,
    // Derived
    selectedCount, estimatedPages,
    // History
    history,
    // Tab
    activeTab, setActiveTab,
  };
}
