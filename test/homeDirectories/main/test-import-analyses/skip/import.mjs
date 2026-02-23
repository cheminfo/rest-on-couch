export function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.skip();
  return result;
}
