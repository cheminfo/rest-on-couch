/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'import_log_data_unexpected_throw';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  entry.importLogData = { parsedLines: 12 };

  throw new Error('this import is wrong');
};
