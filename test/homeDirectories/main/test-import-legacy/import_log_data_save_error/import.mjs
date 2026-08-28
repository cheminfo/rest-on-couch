export function importFile(ctx, result) {
  result.id = 'import_log_data_save_error';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.reference = ctx.filename;
  result.field = 'field';
  // This one will fail to be saved because the jpath does not point to an array
  result.jpath = ['jpath'];
  result.content_type = 'text/plain';
  result.importLogData = { parsedLines: 12 };
}
