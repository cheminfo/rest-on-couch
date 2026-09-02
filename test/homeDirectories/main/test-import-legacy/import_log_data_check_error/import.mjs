export function importFile(ctx, result) {
  result.id = 'import_log_data_check_error';
  result.owner = 'a@a.com';
  result.skipAttachment();
  result.skipMetadata();
  // `kind` is missing, the check of this result will fail
  result.importLogData = { parsedLines: 12 };
}
