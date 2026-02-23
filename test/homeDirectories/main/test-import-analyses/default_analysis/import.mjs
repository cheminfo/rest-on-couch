/**
 * @type import('rest-on-couch/import').ImportAnalysesFunction
 */
export const importAnalyses = async (ctx, createEntryResult) => {
  const entry = createEntryResult();
  entry.id = 'default_analysis';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  entry.addGroup('group1');
  entry.addGroups(['group2', 'group3']);
  entry.content = {
    sideEffect: true,
  };

  entry.addDefaultAnalysis({
    jpath: ['jpath'],
    metadata: { value: 42 },
    reference: ctx.filename,
    attachment: {
      content_type: 'text/plain',
      field: 'field',
    },
  });

  return entry;
};
