export function importFile(ctx, result) {
  throw new ctx.ImportError('this import is wrong', {
    importLogData: { parsedLines: 12 },
  });
}
