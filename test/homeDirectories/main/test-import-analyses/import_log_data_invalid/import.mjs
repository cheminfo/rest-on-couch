/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'import_log_data_invalid';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  // Not valid data
  entry.importLogData = "I'm not an object";

  return entry;
};
