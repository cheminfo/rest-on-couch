export function importFile(ctx, result) {
  result.id = 'import_log_data_invalid';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.skipAttachment();
  result.skipMetadata();
  // Not valid data
  result.importLogData = "I'm not an object";
}
