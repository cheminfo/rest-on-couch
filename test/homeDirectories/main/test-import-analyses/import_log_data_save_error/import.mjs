/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'import_log_data_save_error';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  entry.importLogData = { parsedLines: 12 };

  entry.addDefaultAnalysis({
    // This one will fail to be saved because the jpath does not point to an array
    jpath: ['jpath'],
    reference: ctx.filename,
    metadata: {},
    attachment: {
      field: 'field',
      content_type: 'text/plain',
    },
  });

  return entry;
};
