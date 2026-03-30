'use client';
import { useSendDocuments } from '@/hooks/use-send-documents';

/* ═══════════════════════════════════════════════════════════════
   SendDocumentsModal — LEFT SIDE ONLY
   Full-screen overlay with proper scrolling body.
   The "Open in Email Center" button passes selections via localStorage.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sd: ReturnType<typeof useSendDocuments>;
  onClose: () => void;
}

export default function SendDocumentsModal({ sd, onClose }: Props) {
  if (!sd.isOpen) return null;

  /* ── helpers ─────────────────────────────────────────────── */
  const docItems = [
    { key: 'nda',      icon: '🔒', name: 'NDA',      desc: 'Non-Disclosure Agreement',            fileId: sd.docs.nda },
    { key: 'dpa',      icon: '🛡️', name: 'DPA',      desc: 'Data Processing Agreement',           fileId: sd.docs.dpa },
    { key: 'asa',      icon: '📋', name: 'ASA',      desc: 'Administrative Services Agreement',   fileId: sd.docs.asa },
    { key: 'proposal', icon: '💼', name: 'PROPOSAL', desc: 'Healthcare TPA Services Proposal',    fileId: sd.docs.proposal },
  ];

  const programs = [
    { key: 'silver',    icon: '🥈', name: 'Silver',   limit: '40K / 20K' },
    { key: 'gold',      icon: '🥇', name: 'Gold',     limit: '80K / 40K' },
    { key: 'goldplus',  icon: '🥇+', name: 'Gold+',   limit: '100K / 40K' },
    { key: 'goldplusplus', icon: '🥇++', name: 'Gold++', limit: '150K / 50K' },
    { key: 'platinum',  icon: '💎', name: 'Platinum', limit: '180K / 40K' },
    { key: 'diamond',   icon: '💠', name: 'Diamond',  limit: '360K / 60K' },
    { key: 'dental',    icon: '🦷', name: 'Dental',   limit: 'Add-on' },
  ];

  const selectedDocCount = docItems.filter(d => sd.selectedDocs.includes(d.key)).length;
  const selectedProgCount = programs.filter(p => sd.selectedPrograms.includes(p.key)).length;

  /* ── open in email center ───────────────────────────────── */
  const handleOpenInEmail = () => {
    const payload = {
      offerId: sd.offerId,
      clientName: sd.clientName,
      docs: sd.selectedDocs,
      programs: sd.selectedPrograms,
      format: sd.format,
      signature: sd.signature,
      signatory: sd.signatory,
      fileIds: sd.docs,
    };
    localStorage.setItem('polaris_send_docs', JSON.stringify(payload));
    window.location.href = '/email?sendDocs=true';
  };

  return (
    <>
      {/* ── OVERLAY ── full fixed, no flex, just overflow-y: auto ── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 260, /* sidebar width */
        right: 0, bottom: 0,
        background: '#0d1926',
        zIndex: 10001,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

        {/* ── HEADER ── sticky at top ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)',
          borderBottom: '3px solid #D4AF37',
          padding: '16px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              margin: 0, color: '#fff',
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '1.5rem', fontWeight: 700,
            }}>
              📨 Send Documents
            </h2>
            {sd.clientName && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  background: 'rgba(212,175,55,0.2)', color: '#D4AF37',
                  padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>{sd.clientName}</span>
                {sd.offerId && (
                  <span style={{ color: '#b8d4e8', fontSize: 13 }}>Offer: {sd.offerId}</span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
            fontSize: '1.5rem', transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >✕</button>
        </div>

        {/* ── BODY ── normal flow, scrolls via parent ── */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ═══ SECTION 1: Contract Documents ═══ */}
          <Section icon="📄" title="Contract Documents" badge={selectedDocCount > 0 ? `${selectedDocCount} selected` : undefined}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
            }}>
              {docItems.map(d => {
                const checked = sd.selectedDocs.includes(d.key);
                const hasFile = !!d.fileId;
                return (
                  <label key={d.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    background: checked ? 'rgba(76,175,80,0.12)' : '#0d1926',
                    border: `2px solid ${checked ? '#4CAF50' : 'rgba(45,80,112,0.4)'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative',
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => sd.toggleDoc(d.key)}
                      style={{ width: 22, height: 22, accentColor: '#4CAF50', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                        {d.icon} {d.name}
                      </div>
                      <div style={{ color: '#7aa0c0', fontSize: '0.78rem', marginTop: 2 }}>{d.desc}</div>
                    </div>
                    {hasFile && (
                      <span style={{
                        position: 'absolute', top: 6, right: 8,
                        background: 'rgba(76,175,80,0.25)', color: '#4CAF50',
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 10,
                      }}>✓ Ready</span>
                    )}
                  </label>
                );
              })}
            </div>
          </Section>

          {/* ═══ SECTION 2: Program Brochures ═══ */}
          <Section icon="📋" title="Program Brochures"
            rightLabel="★ Highlighted = Offer programs"
            badge={selectedProgCount > 0 ? `${selectedProgCount} selected` : undefined}
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
            }}>
              {programs.map(p => {
                const checked = sd.selectedPrograms.includes(p.key);
                const highlighted = sd.highlightedPrograms?.includes(p.key);
                return (
                  <label key={p.key} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '12px 8px', textAlign: 'center',
                    background: highlighted ? 'rgba(212,175,55,0.15)' : '#0d1926',
                    border: `2px solid ${checked ? '#4CAF50' : highlighted ? '#D4AF37' : 'rgba(45,80,112,0.4)'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: highlighted ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => sd.toggleProgram(p.key)}
                      style={{ width: 20, height: 20, accentColor: '#4CAF50', cursor: 'pointer', marginBottom: 6 }}
                    />
                    <span style={{ fontSize: '1.6rem', marginBottom: 4 }}>{p.icon}</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                    <span style={{ color: '#7aa0c0', fontSize: '0.7rem', marginTop: 2 }}>{p.limit}</span>
                  </label>
                );
              })}
              {/* Drive / Local */}
              <div style={{
                display: 'flex', flexDirection: 'row',
                border: '2px dashed rgba(212,175,55,0.5)',
                borderRadius: 10, overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))',
              }}>
                <button style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '10px 4px', cursor: 'pointer',
                  border: 'none', borderRight: '1px solid rgba(212,175,55,0.3)',
                  background: 'transparent', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(66,133,244,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1.4rem' }}>☁️</span>
                  <span style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 600 }}>Drive</span>
                </button>
                <button style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '10px 4px', cursor: 'pointer',
                  border: 'none', background: 'transparent', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76,175,80,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1.4rem' }}>💻</span>
                  <span style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 600 }}>Local</span>
                </button>
              </div>
            </div>
          </Section>

          {/* ═══ SECTION 3: Document Format & Status ═══ */}
          <Section icon="📋" title="Document Format & Status">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#7aa0c0', fontSize: '0.82rem', marginBottom: 6 }}>
                  📄 Contract Documents Format
                </label>
                <select
                  value={sd.format}
                  onChange={e => sd.setFormat(e.target.value as 'word' | 'pdf')}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#0d1926', border: '1px solid rgba(45,80,112,0.5)',
                    borderRadius: 8, color: '#fff', fontSize: '0.88rem',
                  }}
                >
                  <option value="word">📝 Word (.docx) - For Review</option>
                  <option value="pdf">📑 PDF - For Signature</option>
                </select>
                <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#D4AF37' }}>
                  ⚠️ Proposals & Quotes → Always PDF (locked)
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#7aa0c0', fontSize: '0.82rem', marginBottom: 6 }}>
                  📊 Update Status After Send
                </label>
                <select
                  value={sd.newStatus || ''}
                  onChange={e => sd.setNewStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#0d1926', border: '1px solid rgba(45,80,112,0.5)',
                    borderRadius: 8, color: '#fff', fontSize: '0.88rem',
                  }}
                >
                  <option value="">-- No Change --</option>
                  <option value="sent">📤 Sent</option>
                  <option value="pending_signature">✍️ Pending Signature</option>
                  <option value="accepted">✅ Accepted</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>
          </Section>

          {/* ═══ SECTION 4: Signature Options ═══ */}
          <Section icon="✍️" title="Signature Options">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 18px',
                background: sd.signature ? 'rgba(156,39,176,0.12)' : '#0d1926',
                border: `2px solid ${sd.signature ? '#9c27b0' : 'rgba(45,80,112,0.4)'}`,
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={sd.signature}
                  onChange={() => sd.setSignature(!sd.signature)}
                  style={{ width: 22, height: 22, accentColor: '#9c27b0', cursor: 'pointer' }}
                />
                <span style={{ color: '#fff', fontWeight: 600 }}>Sign Documents</span>
              </label>
              <select
                value={sd.signatory}
                onChange={e => sd.setSignatory(e.target.value)}
                disabled={!sd.signature}
                style={{
                  flex: 1, minWidth: 250, padding: '12px 16px',
                  background: '#0d1926', border: `2px solid ${sd.signature ? '#9c27b0' : 'rgba(45,80,112,0.3)'}`,
                  borderRadius: 10, color: sd.signature ? '#fff' : '#667',
                  fontSize: '0.92rem', cursor: sd.signature ? 'pointer' : 'not-allowed',
                }}
              >
                <option value="">-- Select Signatory --</option>
                <option value="apostolos_kagelaris">Apostolos Kagelaris (CEO)</option>
              </select>
            </div>
          </Section>

          {/* ═══ FOOTER / ACTION BAR ═══ */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px',
            background: 'rgba(13,25,38,0.8)',
            border: '1px solid rgba(45,80,112,0.3)',
            borderRadius: 12, flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {selectedDocCount > 0 && (
                <span style={{
                  background: 'rgba(76,175,80,0.2)', color: '#4CAF50',
                  padding: '5px 14px', borderRadius: 20, fontWeight: 600, fontSize: '0.82rem',
                }}>📄 {selectedDocCount} docs</span>
              )}
              {selectedProgCount > 0 && (
                <span style={{
                  background: 'rgba(33,150,243,0.2)', color: '#42A5F5',
                  padding: '5px 14px', borderRadius: 20, fontWeight: 600, fontSize: '0.82rem',
                }}>📋 {selectedProgCount} brochures</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{
                padding: '10px 22px', border: 'none', borderRadius: 25,
                background: '#3d4f63', color: '#fff',
                fontFamily: "'Montserrat', sans-serif", fontWeight: 600,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
              }}>Cancel</button>
              <button
                onClick={handleOpenInEmail}
                disabled={selectedDocCount === 0 && selectedProgCount === 0}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 25,
                  background: (selectedDocCount + selectedProgCount) > 0
                    ? 'linear-gradient(135deg, #D4AF37, #c49932)'
                    : '#3d4f63',
                  color: (selectedDocCount + selectedProgCount) > 0 ? '#1e3a5f' : '#667',
                  fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                  fontSize: '0.88rem', cursor: (selectedDocCount + selectedProgCount) > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                📧 Open in Email Center
              </button>
            </div>
          </div>

        </div>{/* end body */}
      </div>{/* end overlay */}
    </>
  );
}

/* ── Section wrapper ─────────────────────────────────────── */
function Section({ icon, title, rightLabel, badge, children }: {
  icon: string; title: string; rightLabel?: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(13,25,38,0.5)',
      border: '1px solid rgba(45,80,112,0.3)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #2a4a6f)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <h3 style={{
          margin: 0, color: '#fff',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '1rem', fontWeight: 700,
        }}>{title}</h3>
        {badge && (
          <span style={{
            marginLeft: 8, background: 'rgba(76,175,80,0.2)', color: '#4CAF50',
            padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600,
          }}>{badge}</span>
        )}
        {rightLabel && (
          <span style={{
            marginLeft: 'auto', fontSize: '0.78rem', color: '#D4AF37',
          }}>{rightLabel}</span>
        )}
      </div>
      <div style={{ padding: '16px 18px' }}>
        {children}
      </div>
    </div>
  );
}
