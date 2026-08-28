export function importFile(ctx, result) {
  result.id = 'import_log_data_unexpected_throw';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.importLogData = { parsedLines: 12 };

  throw new Error('this import is wrong');
}
