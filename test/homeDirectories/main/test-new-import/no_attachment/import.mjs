export function importFile(ctx, result) {
  result.kind = 'sample';
  result.id = ctx.filename;
  result.owner = 'a@a.com';
  result.reference = ctx.filename;
  result.jpath = ['jpath', 'in', 'document'];
  result.content = {
    sideEffect: true,
  };
  result.skipAttachment();
  result.metadata = {
    hasMetadata: true,
  };
  result.addGroup('group1');
  result.addGroups(['group2', 'group3']);
}
