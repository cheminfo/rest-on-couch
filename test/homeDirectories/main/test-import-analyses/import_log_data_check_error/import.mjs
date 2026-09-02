/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'import_log_data_check_error';
  entry.owner = 'a@a.com';
  // `kind` is missing, the check of this entry will fail
  entry.importLogData = { parsedLines: 12 };

  return entry;
};
