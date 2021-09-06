'use strict';

const { getImportConfig } = require('../config/config');
const debug = require('../util/debug')('import');

const BaseImport = require('./ImportContext');
const ImportResult = require('./ImportResult');
const saveResult = require('./saveResult');

exports.import = async function importFile(
  database,
  importName,
  filePath,
  options = {},
) {
  debug('import %s (%s, %s)', filePath, database, importName);

  const dryRun = !!options.dryRun;

  const config = getImportConfig(database, importName);

  const baseImport = new BaseImport(filePath, database);
  const result = new ImportResult();

  const { couch, filename, fileDir } = baseImport;

  try {
    await config(baseImport, result);
  } catch (e) {
    await couch
      .logImport({
        name: importName,
        filename,
        fileDir,
        status: 'ERROR',
        error: {
          message: e.message || '',
          stack: e.stack || '',
        },
      })
      .catch((error) => {
        debug.error(
          'error while logging import error for (%s)',
          filename,
          error,
        );
      });
    throw e;
  }

  if (result.isSkipped) {
    return { skip: 'skip' };
  }
  // Check that required properties have been set on the result
  result.check();
  if (dryRun) {
    return { skip: 'dryRun', result };
  }
  const uuid = await saveResult(baseImport, result);

  await couch
    .logImport({
      name: importName,
      filename,
      fileDir,
      status: 'SUCCESS',
      result: {
        uuid,
        id: result.id,
        kind: result.kind,
        owner: result.owner,
      },
    })
    .catch((error) => {
      debug.error(
        'error while logging import success for (%s)',
        filename,
        error,
      );
    });

  return { ok: true, result };
};
