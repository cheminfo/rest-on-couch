export async function importFile(ctx, result) {
  result.id = 'default_analysis';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.addGroup('group1');
  result.addGroups(['group2', 'group3']);
  result.content = {
    sideEffect: true,
  };
  result.jpath = ['jpath'];
  result.metadata = { value: 42 };
  result.reference = ctx.filename;
  result.content_type = 'text/plain';
  result.field = 'field';
}
