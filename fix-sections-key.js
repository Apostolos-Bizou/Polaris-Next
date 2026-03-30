// fix-sections-key.js
const fs = require('fs');
const f = 'src/app/(admin)/reports/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: s.id -> s.key in handlePdfGenerate
c = c.replace(
  'rp.sections.forEach((s) => { sectionMap[s.id] = s.checked; });',
  'rp.sections.forEach((s) => { sectionMap[s.key] = s.checked; });'
);
c = c.replace(
  'rp.sections.filter((s) => s.checked).length',
  'rp.sections.filter((s) => s.checked).length'
);

// Fix 2: Add PDF generation progress modal if not present
if (!c.includes('pdfGenerating')) {
  console.log('WARNING: pdfGenerating state not found - skipping modal injection');
} else if (!c.includes('pdf-gen-modal')) {
  // Find the closing </div> of the page and insert modal before it
  const lastDiv = c.lastIndexOf('</div>');
  if (lastDiv > -1) {
    const modal = `

      {/* PDF Generation Modal */}
      {pdfGenerating && (
        <div className="pdf-gen-modal" style={{
          position: 'fixed', top: 0, left: '260px', right: 0, bottom: 0,
          background: 'rgba(10,22,40,0.92)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0d1f2d, #152a3a)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '480px',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
              {pdfStatus === 'done' ? '\\u2705' : pdfStatus === 'error' ? '\\u274C' : '\\uD83D\\uDCC4'}
            </div>
            <h3 style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: '1.3rem',
              fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff'
            }}>
              {pdfStatus === 'done' ? 'Report Generated!' : pdfStatus === 'error' ? 'Generation Failed' : 'Generating Report...'}
            </h3>
            <p style={{ color: 'rgba(184,212,232,0.7)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              {pdfStep}
            </p>
            <div style={{
              width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%', borderRadius: '4px', transition: 'width 0.3s',
                width: pdfProgress + '%',
                background: pdfStatus === 'done'
                  ? 'linear-gradient(90deg, #27ae60, #2ecc71)'
                  : pdfStatus === 'error'
                  ? '#e74c3c'
                  : 'linear-gradient(90deg, #D4AF37, #FFD700)'
              }} />
            </div>
            <p style={{ color: 'rgba(184,212,232,0.4)', fontSize: '0.8rem' }}>
              {pdfProgress}% complete
            </p>
            {(pdfStatus === 'done' || pdfStatus === 'error') && (
              <button
                onClick={() => { setPdfGenerating(false); setPdfProgress(0); }}
                style={{
                  marginTop: '1rem', padding: '0.6rem 2rem', borderRadius: '10px',
                  background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)',
                  color: '#D4AF37', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
`;
    c = c.substring(0, lastDiv) + modal + '\n    ' + c.substring(lastDiv);
    console.log('Added PDF generation progress modal');
  }
}

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed! s.id -> s.key + progress modal added');
console.log('Refresh browser and click Generate Report');
