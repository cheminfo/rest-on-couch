export function importFile(ctx, result) {
  result.kind = 'sample';
  result.id = 'esm_import';
  result.reference = 'esm_import';
  result.owner = 'a@a.com';
  result.jpath = ['main', 'jpath'];
  result.field = 'field';
}
