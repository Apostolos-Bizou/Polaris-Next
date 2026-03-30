// patch-reports-pdf.js
// Adds real PDF generation to the Reports page
// Usage: node patch-reports-pdf.js
// Run from: C:\Users\akage\Downloads\polaris-phase1\polaris

const fs = require('fs');
const path = require('path');

const reportsPath = path.join(__dirname, 'src', 'app', '(admin)', 'reports', 'page.tsx');

if (!fs.existsSync(reportsPath)) {
  console.log('\u274C Reports page not found at:', reportsPath);
  process.exit(1);
}

let content = fs.readFileSync(reportsPath, 'utf8');

// Check if already patched
if (content.includes('generatePolarisReport')) {
  console.log('\u2705 Reports page already has PDF generation integrated');
  process.exit(0);
}

// 1. Add the import for generatePolarisReport
// Find the last import line
const importMatch = content.match(/^import .+$/m);
if (importMatch) {
  const lastImportIndex = content.lastIndexOf('import ');
  const lineEnd = content.indexOf('\n', lastImportIndex);
  const insertAfter = content.substring(0, lineEnd + 1);
  const rest = content.substring(lineEnd + 1);
  content = insertAfter + 'import { generatePolarisReport } from "@/lib/report-pdf-generator";\n' + rest;
  console.log('\u2705 Added generatePolarisReport import');
}

// 2. Find the generateReport / handleGenerate function and replace it
// Look for common patterns in the generate button handler
const generatePatterns = [
  // Pattern 1: alert-based placeholder
  /const\s+handleGenerate\s*=\s*(?:async\s*)?\(\)\s*=>\s*\{[^}]*alert\([^)]*\)[^}]*\}/,
  // Pattern 2: console.log placeholder  
  /const\s+handleGenerate\s*=\s*(?:async\s*)?\(\)\s*=>\s*\{[^}]*console\.log\([^)]*\)[^}]*\}/,
  // Pattern 3: any handleGenerate with simple body
  /const\s+handleGenerate\s*=\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/,
  // Pattern 4: generateReport function
  /const\s+generateReport\s*=\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/,
  // Pattern 5: function named handleGenerateReport
  /const\s+handleGenerateReport\s*=\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/,
];

const newGenerateFunction = `const handleGenerate = async () => {
    // Build sections map from current state
    const sectionMap: Record<string, boolean> = {};
    sections.forEach((s: { id: string; checked: boolean }) => {
      sectionMap[s.id] = s.checked;
    });

    const selectedCount = sections.filter((s: { checked: boolean }) => s.checked).length;
    if (selectedCount === 0) {
      alert("\u26A0\uFE0F \u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03C4\u03BF\u03C5\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF\u03BD \u03BC\u03AF\u03B1 \u03B5\u03BD\u03CC\u03C4\u03B7\u03C4\u03B1");
      return;
    }

    // Get client name
    let clientDisplayName = "All Clients (Company-wide)";
    if (selectedClient !== "all") {
      const found = clients.find((c: { id: string; name: string }) => c.id === selectedClient);
      if (found) clientDisplayName = found.name;
    }

    setGenerating(true);
    setGenProgress(0);
    setGenStep("\u0395\u03BA\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7...");
    setGenStatus("working");

    try {
      await generatePolarisReport(
        {
          client: selectedClient,
          clientName: clientDisplayName,
          fromPeriod,
          toPeriod,
          format: exportFormat,
          sections: sectionMap,
        },
        (percent: number, step: string) => {
          setGenProgress(percent);
          setGenStep(step);
        }
      );

      setGenStatus("done");
      setGenStep("\u2705 \u0397 \u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AE\u03B8\u03B7\u03BA\u03B5 \u03B5\u03C0\u03B9\u03C4\u03C5\u03C7\u03CE\u03C2!");

      // Add to history
      setRecentReports((prev: GeneratedReport[]) => [
        {
          id: "RPT-" + Date.now(),
          title: "Analytics Report",
          client: clientDisplayName,
          period: fromPeriod + " - " + toPeriod,
          format: exportFormat.toUpperCase(),
          sections: selectedCount,
          pages: selectedCount + 1,
          date: new Date().toLocaleDateString("el-GR"),
          status: "completed" as const,
        },
        ...prev,
      ]);

      // Auto-close after 3 seconds
      setTimeout(() => {
        setGenerating(false);
        setGenProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Report generation failed:", error);
      setGenStatus("error");
      setGenStep("\u274C \u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1\u03C2");
      setTimeout(() => {
        setGenerating(false);
      }, 3000);
    }
  };`;

let patched = false;
for (const pattern of generatePatterns) {
  if (pattern.test(content)) {
    content = content.replace(pattern, newGenerateFunction);
    console.log('\u2705 Replaced generate function with real PDF generation');
    patched = true;
    break;
  }
}

if (!patched) {
  // If we couldn't find the function, try to find it by button onClick
  // Look for onClick={handleGenerate} or onClick={generateReport} etc.
  // and just insert the function before the return statement
  const returnMatch = content.match(/(\s+return\s*\()/);
  if (returnMatch && returnMatch.index) {
    const insertPos = returnMatch.index;
    content = content.substring(0, insertPos) + '\n\n  ' + newGenerateFunction + '\n' + content.substring(insertPos);
    console.log('\u2705 Inserted generate function before return');
    patched = true;
  }
}

if (!patched) {
  console.log('\u26A0\uFE0F Could not auto-patch. You may need to manually add the generate function.');
}

// 3. Make sure the Generate button uses the right function name
// Check if button references generateReport instead of handleGenerate
if (content.includes('onClick={generateReport}') || content.includes('onClick={() => generateReport()}')) {
  content = content.replace(/onClick=\{generateReport\}/g, 'onClick={handleGenerate}');
  content = content.replace(/onClick=\{?\(\)\s*=>\s*generateReport\(\)\}?/g, 'onClick={handleGenerate}');
  console.log('\u2705 Updated button onClick to handleGenerate');
}

// Write back
fs.writeFileSync(reportsPath, content, 'utf8');
console.log('\u2705 Reports page patched successfully!');
console.log('');
console.log('\u{1F4CB} Next: npm install jspdf');
console.log('   Then refresh browser and test the Generate button');
