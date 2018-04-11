'use strict';

function publishEntry(deposition, zenodo) {
  return zenodo.depositions.publish({
    id: deposition.id
  });
}

module.exports = publishEntry;
