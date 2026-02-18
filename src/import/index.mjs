import BaseImport from './ImportContext.mjs';
import saveResult from './saveResult.mjs';

import config from '../config/config.js';
import debugUtils from '../util/debug.js';
import constants from '../constants.js';
import { EntryImportResult } from './EntryImportResult.mjs';
import { LegacyImportResult } from './LegacyImportResult.mjs';

const debug = debugUtils('import');
const { kImportType } = constants;

export default async function importFile(
  database,
  importName,
  filePath,
  options = {},
) {
  debug('import %s (%s, %s)', filePath, database, importName);

  const dryRun = !!options.dryRun;

  const dbConfig = config.getImportConfig(database, importName);

  const baseImport = new BaseImport(filePath, database);
  let result = new LegacyImportResult(baseImport);
  const createEntryImportResult = () => new EntryImportResult(baseImport);

  const { couch, filename, fileDir } = baseImport;

  let uuid;
  try {
    if (dbConfig[kImportType] === 'importAnalyses') {
      // TODO: comment in PR about the different pattern here
      result = await dbConfig(baseImport, createEntryImportResult);
    } else {
      await dbConfig(baseImport, result);
    }
    result.check();

    if (result.isSkipped) {
      return { skip: 'skip' };
    }

    // Check that required properties have been set on the result
    if (dryRun) {
      return { skip: 'dryRun', result };
    }
    uuid = await saveResult(baseImport, result);
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
}
