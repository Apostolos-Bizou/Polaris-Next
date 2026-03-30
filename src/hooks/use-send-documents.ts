'use client';

import { useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   useSendDocuments — manages state for the Send Documents modal
   ═══════════════════════════════════════════════════════════════ */

export function useSendDocuments() {
  const [isOpen, setIsOpen] = useState(false);
  const [offerId, setOfferId] = useState('');
  const [clientName, setClientName] = useState('');

  // Document file IDs (from Drive, populated when opening)
  const [docs, setDocs] = useState<Record<string, string>>({
    nda: '', dpa: '', asa: '', proposal: '', comparison_quote: '',
  });

  // Selected documents & programs
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [highlightedPrograms, setHighlightedPrograms] = useState<string[]>([]);

  // Format & signature
  const [format, setFormat] = useState<'word' | 'pdf'>('word');
  const [newStatus, setNewStatus] = useState('');
  const [signature, setSignature] = useState(false);
  const [signatory, setSignatory] = useState('');

  // Toggle a document selection
  const toggleDoc = useCallback((key: string) => {
    setSelectedDocs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  // Toggle a program selection
  const toggleProgram = useCallback((key: string) => {
    setSelectedPrograms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }, []);

  // Open the modal with offer data
  const open = useCallback((offer: {
    offer_id: string;
    client_name: string;
    items?: Array<{ plan_name: string }>;
    docs?: Record<string, string>;
  }) => {
    setOfferId(offer.offer_id);
    setClientName(offer.client_name);
    setDocs(offer.docs || { nda: '', dpa: '', asa: '', proposal: '', comparison_quote: '' });

    // Auto-select docs that have file IDs
    const autoSelected: string[] = [];
    if (offer.docs) {
      Object.entries(offer.docs).forEach(([key, val]) => {
        if (val) autoSelected.push(key);
      });
    }
    setSelectedDocs(autoSelected);

    // Highlight programs that match the offer's plans
    const planMap: Record<string, string> = {
      'Silver': 'silver', 'Gold': 'gold', 'Gold+': 'goldplus',
      'Gold Plus': 'goldplus', 'Gold++': 'goldplusplus',
      'Gold Plus Plus': 'goldplusplus', 'Platinum': 'platinum',
      'Diamond': 'diamond', 'Dental': 'dental',
    };
    const highlighted: string[] = [];
    const autoProgs: string[] = [];
    if (offer.items) {
      offer.items.forEach(item => {
        const key = planMap[item.plan_name];
        if (key) {
          highlighted.push(key);
          autoProgs.push(key);
        }
      });
    }
    setHighlightedPrograms(highlighted);
    setSelectedPrograms(autoProgs);

    setFormat('word');
    setNewStatus('');
    setSignature(false);
    setSignatory('');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen, open, close, openModal: open, closeModal: close, openModal: open, closeModal: close,
    offerId, clientName,
    docs,
    selectedDocs, toggleDoc,
    selectedPrograms, toggleProgram, highlightedPrograms,
    format, setFormat,
    newStatus, setNewStatus,
    signature, setSignature,
    signatory, setSignatory,
  };
}
