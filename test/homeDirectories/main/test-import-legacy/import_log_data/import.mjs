export function importFile(ctx, result) {
  result.id = 'import_log_data';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.skipAttachment();
  result.skipMetadata();
  result.importLogData = {
    from: 'legacy',
    values: [1, 2, 3],
    nested: { ok: true },
  };
}
