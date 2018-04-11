'use strict';

const getZenodoDeposition = require('./getZenodoDeposition');

// entry is the $content.meta of the ROC entry
async function createEntry(entry, self) {
  if (!entry.metadata) {
    entry = getZenodoDeposition(entry, self);
  }
  const deposition = await self.zenodo.depositions.create(entry);
  return deposition.data;
}

module.exports = createEntry;
