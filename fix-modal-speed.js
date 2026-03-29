const fs = require('fs');
const path = require('path');
const f = path.join(__dirname, 'src', 'hooks', 'use-send-documents.ts');
let c = fs.readFileSync(f, 'utf8');

// Move setIsOpen(true) BEFORE the await calls
// Current order: await loadRecipients → await loadOfferDocs → loadTemplates → setIsOpen(true)
// New order: setIsOpen(true) → then async load all

c = c.replace(
  `      // Load recipients
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
    setIsOpen(true);`,
  `    } else {
      setOffer(null);
      setShowClientSearch(true);
      setShowCQ(false);
    }

    // Open modal IMMEDIATELY
    setIsOpen(true);

    // Load data async (non-blocking)
    if (offerData) {
      loadRecipients(offerData.clientId, offerData.contactName, offerData.contactEmail);
      loadOfferDocs(offerData.offerId);
    }
    loadTemplates();`
);

fs.writeFileSync(f, c, 'utf8');
console.log('✅ Modal now opens instantly — data loads async in background');
