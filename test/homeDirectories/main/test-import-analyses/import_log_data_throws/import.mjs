/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  throw new ctx.ImportError('this import is wrong', {
    importLogData: { parsedLines: 12 },
  });
};
