// fix-pdf-generate.js
// Run: node fix-pdf-generate.js
const fs = require('fs');
const f = 'src/app/(admin)/reports/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Remove old broken destructure line
c = c.replace(/const \{ sections, selectedClient, clients, fromPeriod, toPeriod, exportFormat, generating, setGenerating[^;]+;\n?/g, '');

// 2. Remove old handleGenerate function if present
c = c.replace(/const handleGenerate = async \(\) => \{[\s\S]*?\n  \};?\n?/g, '');

// 3. Remove old import of generatePolarisReport
c = c.replace(/import \{ generatePolarisReport \}[^\n]+\n/g, '');

// 4. Remove any duplicate useState import
c = c.replace(/import \{ useState as usePdfState \}[^\n]+\n/g, '');

// 5. Add import at top
const firstImport = c.indexOf('import ');
c = c.substring(0, firstImport) +
  'import { generatePolarisReport } from "@/lib/report-pdf-generator";\n' +
  c.substring(firstImport);

// 6. Replace onClick={handleGenerate} or onClick={handlePdfGenerate} with new name
c = c.replace(/onClick=\{handleGenerate\}/g, 'onClick={handlePdfGenerate}');
c = c.replace(/onClick=\{handlePdfGenerate\}/g, 'onClick={handlePdfGenerate}');

// 7. Find "const rp = useReports();" and inject state + function after it
const hookLine = 'const rp = useReports();';
const hookIndex = c.indexOf(hookLine);

if (hookIndex === -1) {
  console.log('ERROR: Could not find "const rp = useReports();"');
  process.exit(1);
}

// Check if already patched
if (c.includes('handlePdfGenerate')) {
  // Remove old injection first
  c = c.replace(/\n\s*const \[pdfGenerating[\s\S]*?handlePdfGenerate[\s\S]*?\n  \};/g, '');
}

const injection = `
  const [pdfGenerating, setPdfGenerating] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState(0);
  const [pdfStep, setPdfStep] = React.useState("");
  const [pdfStatus, setPdfStatus] = React.useState("working");

  const handlePdfGenerate = async () => {
    const sectionMap = {};
    rp.sections.forEach((s) => { sectionMap[s.id] = s.checked; });
    const selectedCount = rp.sections.filter((s) => s.checked).length;
    if (selectedCount === 0) { alert("Select at least one section"); return; }
    let clientName = "All Clients (Company-wide)";
    if (rp.selectedClient !== "all") {
      const found = rp.clients.find((c) => c.id === rp.selectedClient);
      if (found) clientName = found.name;
    }
    setPdfGenerating(true);
    setPdfProgress(0);
    setPdfStep("Starting...");
    setPdfStatus("working");
    try {
      await generatePolarisReport(
        {
          client: rp.selectedClient,
          clientName: clientName,
          fromPeriod: rp.fromPeriod,
          toPeriod: rp.toPeriod,
          format: rp.format,
          sections: sectionMap,
        },
        (pct, step) => {
          setPdfProgress(pct);
          setPdfStep(step);
        }
      );
      setPdfStatus("done");
      setPdfStep("PDF generated successfully!");
      setTimeout(() => { setPdfGenerating(false); setPdfProgress(0); }, 3000);
    } catch (e) {
      console.error("PDF generation error:", e);
      setPdfStatus("error");
      setPdfStep("Generation failed");
      setTimeout(() => { setPdfGenerating(false); }, 3000);
    }
  };`;

// Re-find hookLine position (may have shifted)
const newHookIndex = c.indexOf(hookLine);
const afterHook = newHookIndex + hookLine.length;
c = c.substring(0, afterHook) + injection + c.substring(afterHook);

// 8. Add React import if not present (for React.useState)
if (!c.includes('import React')) {
  c = 'import React from "react";\n' + c;
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done! PDF generation integrated.');
console.log('Refresh browser and click Generate Report.');
