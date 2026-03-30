// fix-use-client.js
const fs = require('fs');
const f = 'src/app/(admin)/reports/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Remove "use client" from wherever it is
c = c.replace(/"use client";\n/g, '');
c = c.replace(/'use client';\n/g, '');

// Remove import React if present (not needed, React.useState -> just useState)
c = c.replace('import React from "react";\n', '');

// Replace React.useState with useState (already imported via useReports or we add it)
c = c.replace(/React\.useState/g, 'useState');

// Make sure useState is imported from react
if (!c.includes("import { useState }") && !c.includes("useState }")) {
  // Add useState import
  const firstImport = c.indexOf('import ');
  c = c.substring(0, firstImport) + 'import { useState } from "react";\n' + c.substring(firstImport);
}

// Add "use client" at the very top
c = '"use client";\n\n' + c;

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed! "use client" is now at line 1.');
