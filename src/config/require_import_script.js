'use strict';

const path = require('node:path');
const constants = require('../constants.js');
const fs = require('node:fs');

module.exports = function requireImportScript(importPath) {
  const importConfigPath = path.join(importPath, 'import.js');
  const importConfigPathEsm = path.join(importPath, 'import.mjs');
  let importConfig = {};
  if (fs.existsSync(importConfigPath)) {
    importConfig = require(importConfigPath);
  } else if (fs.existsSync(importConfigPathEsm)) {
    let type;
    importConfig = require(importConfigPathEsm);
    if (importConfig.importFile) {
      importConfig = importConfig.importFile;
    } else if (importConfig.importAnalyses) {
      type = 'importAnalyses';
      importConfig = importConfig.importAnalyses;
    }
    if (!importConfig || typeof importConfig !== 'function') {
      throw new Error('import.mjs must export an `importFile` function');
    }
    importConfig[constants.kImportType] = type;
  }
  return importConfig;
};
