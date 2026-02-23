export function importAnalyses(ctx, createResult) {
  const result = createResult();
  result.id = 'no_attachment';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.content = {
    sideEffect: true,
  };
  result.addGroup('group1');
  result.addGroups(['group2', 'group3']);

  result.addAnalysis({
    reference: ctx.filename,
    jpath: ['jpath', 'in', 'document'],
    metadata: { hasMetadata: true },
  });

  return result;
}
