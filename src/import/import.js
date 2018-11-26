'use strict';

const debug = require('../util/debug')('import');
const { getImportConfig } = require('../config/config');

const BaseImport = require('./ImportContext');
const ImportResult = require('./ImportResult');
const saveResult = require('./saveResult');

exports.import = async function importFile(
  database,
  importName,
  filePath,
  options = {}
) {
  debug('import %s (%s, %s)', filePath, database, importName);

  const dryRun = !!options.dryRun;

  const config = getImportConfig(database, importName);

  const baseImport = new BaseImport(filePath, database);
  const result = new ImportResult();
  await config(baseImport, result);
  if (result.isSkipped) {
    return { skip: 'skip' };
  }
  // Check that required properties have been set on the result
  result.check();
  if (dryRun) {
    return { skip: 'dryRun', result };
  }
  await saveResult(baseImport, result);
  return { ok: true };
};
