/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'import_log_data_invalid';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  // Not a plain JSON object
  entry.importLogData = new Date();

  return entry;
};
