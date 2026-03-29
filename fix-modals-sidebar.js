const fs = require('fs');
const path = require('path');

// Fix Accept Offer Modal
const aoFile = path.join(__dirname, 'src', 'components', 'offers', 'accept-offer-modal.tsx');
let ao = fs.readFileSync(aoFile, 'utf8');

// 1. Modal starts after sidebar (left: 260px instead of 0)
ao = ao.replace(
  '.ao-fs{position:fixed;top:0;left:0;width:100%;height:100%;',
  '.ao-fs{position:fixed;top:0;left:260px;width:calc(100% - 260px);height:100%;'
);
console.log('✅ Accept Modal: sidebar visible (left:260px)');

// 2. Replace all grey (#2d3748) with dark navy
ao = ao.replaceAll('#2d3748', '#0d1f2d');
console.log('✅ Accept Modal: #2d3748 → #0d1f2d');

// 3. Replace grey borders (#4a5568) with navy borders
ao = ao.replaceAll('#4a5568', 'rgba(45,80,112,0.35)');
console.log('✅ Accept Modal: #4a5568 → rgba(45,80,112,0.35)');

// 4. Notes textarea background
ao = ao.replace('background:#1a2332', 'background:rgba(10,22,40,0.8)');
console.log('✅ Accept Modal: notes bg fixed');

fs.writeFileSync(aoFile, ao, 'utf8');

// Also fix Send Documents Modal
const sdFile = path.join(__dirname, 'src', 'components', 'offers', 'send-documents-modal.tsx');
let sd = fs.readFileSync(sdFile, 'utf8');

// Same fixes for Send Docs
sd = sd.replace(
  '.sd-modal{position:fixed;top:0;left:0;width:100%;height:100%;',
  '.sd-modal{position:fixed;top:0;left:260px;width:calc(100% - 260px);height:100%;'
);
console.log('✅ Send Docs Modal: sidebar visible (left:260px)');

sd = sd.replaceAll('#2d3748', '#0d1f2d');
sd = sd.replaceAll('#4a5568', 'rgba(45,80,112,0.35)');
sd = sd.replaceAll('background:#1a2332', 'background:rgba(10,22,40,0.8)');
console.log('✅ Send Docs Modal: grey → dark navy');

fs.writeFileSync(sdFile, sd, 'utf8');

console.log('\n✅ Both modals fixed!');
