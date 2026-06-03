/**
 * @type import('rest-on-couch/import').ImportFileFunction
 */
export const importFile = (ctx, result) => {
  result.id = 'no_metadata';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.jpath = ['jpath'];
  result.reference = ctx.filename;
  result.content_type = 'text/plain';
  result.field = 'field';
};
