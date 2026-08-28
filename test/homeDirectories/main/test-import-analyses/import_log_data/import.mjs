/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry1 = createEntryResult();
  entry1.id = 'import_log_data_1';
  entry1.kind = 'sample';
  entry1.owner = 'a@a.com';
  entry1.importLogData = {
    from: 'entry1',
    values: [1, 2, 3],
    nested: { ok: true },
  };

  const entry2 = createEntryResult();
  entry2.id = 'import_log_data_2';
  entry2.kind = 'sample';
  entry2.owner = 'a@a.com';
  entry2.importLogData = { from: 'entry2' };

  // Third entry without any custom import log data
  const entry3 = createEntryResult();
  entry3.id = 'import_log_data_3';
  entry3.kind = 'sample';
  entry3.owner = 'a@a.com';

  return [entry1, entry2, entry3];
};
