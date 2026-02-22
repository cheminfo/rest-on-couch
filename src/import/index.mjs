import ImportContext from './ImportContext.mjs';
import saveResult from './saveResult.mjs';

import config from '../config/config.js';
import debugUtils from '../util/debug.js';
import constants from '../constants.js';
import { EntryImportResult } from './EntryImportResult.mjs';
import { LegacyImportResult } from './LegacyImportResult.mjs';
import { SaveImportError } from './SaveImportError.mjs';

const debug = debugUtils('import');
const { kImportType } = constants;

// These types are useful for writing import scripts
/** @typedef {InstanceType<typeof LegacyImportResult>} LegacyImportResultInstance */
/** @typedef {InstanceType<typeof EntryImportResult>} EntryImportResultInstance */
/** @typedef {(ctx: InstanceType<typeof ImportContext>, createEntryResult: () => EntryImportResultInstance) => Promise<EntryImportResultInstance | EntryImportResultInstance[]> } ImportAnalysesFunction */
/** @typedef {(ctx: InstanceType<typeof ImportContext>, result: LegacyImportResultInstance) => Promise<void>} ImportFileFunction */

export default async function importFile(
  database,
  importName,
  filePath,
  options = {},
) {
  debug('import %s (%s, %s)', filePath, database, importName);

  const dryRun = !!options.dryRun;

  const dbConfig = config.getImportConfig(database, importName);

  const importContext = new ImportContext(filePath, database);
  let results = [new LegacyImportResult(importContext)];
  const createEntryImportResult = () => new EntryImportResult(importContext);

  const { couch, filename, fileDir } = importContext;

  const logBase = {
    name: importName,
    filename,
    fileDir,
  };

  const errors = [];
  try {
    if (dbConfig[kImportType] === 'importAnalyses') {
      results = await dbConfig(importContext, createEntryImportResult);
      if (!Array.isArray(results)) {
        results = [results];
      }
      checkReturnType(results);
    } else {
      await dbConfig(importContext, results[0]);
    }

    if (results.some((result) => result.isSkipped)) {
      return { skip: 'skip' };
    }

    results = results.filter((result) => !result.isSkipped);
    for (let result of results) {
      result.check();
    }

    // Check that required properties have been set on the results
    if (dryRun) {
      return { skip: 'dryRun', results };
    }

    for (let result of results) {
      const safeResult = await safeSaveResult(importContext, result);
      if (safeResult.ok) {
        await couch
          .logImport({
            name: importName,
            filename,
            fileDir,
            status: 'SUCCESS',
            result: {
              uuid: safeResult.uuid,
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
      } else {
        result.error = safeResult.error;
        errors.push(safeResult.error);
        await logError(
          couch,
          {
            ...logBase,
            result: { id: result.id, kind: result.kind, owner: result.owner },
          },
          safeResult.error,
        );
      }
    }
  } catch (error) {
    await logError(couch, logBase, error);
    throw error;
  }

  if (errors.length > 0) {
    throw new SaveImportError(
      'Some import results could not be saved',
      results,
    );
  }
  return { ok: true, results };
}

async function safeSaveResult(importContext, result) {
  try {
    const uuid = await saveResult(importContext, result);
    return {
      ok: true,
      uuid,
    };
  } catch (error) {
    return {
      ok: false,
      error,
    };
  }
}

async function logError(couch, logBase, error) {
  await couch
    .logImport({
      ...logBase,
      status: 'ERROR',
      error: {
        message: error.message,
        stack: error.stack,
      },
    })
    .catch((error) => {
      debug.error(
        'error while logging import error for (%s)',
        logBase.filename,
        error,
      );
    });
}

function checkReturnType(results) {
  for (let result of results) {
    if (result === undefined || !(result instanceof EntryImportResult)) {
      throw new Error(
        'The importAnalyses function did not return the expected results.\nMake sure to always return an instance of EntryImportResult, which can be created by calling the second argument of the function.',
      );
    }
  }
}
