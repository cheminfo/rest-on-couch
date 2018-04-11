'use strict';

function getIndexMd(deposition, self) {
  let url = `${self.visualizationUrl}/${deposition.id}`;
  if (self.isSandbox) {
    url += '?sandbox=1';
  }
  const indexPage = {
    filename: '00_index/README.md',
    contentType: 'text/markdown',
    data: `Visualize the data for this publication: [open entry](${url})`
  };
  return indexPage;
}

module.exports = getIndexMd;
