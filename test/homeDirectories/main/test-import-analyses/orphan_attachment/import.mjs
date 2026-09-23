export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'orphan_attachment';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  // Use a different filename on the second import of the same reference + field
  let exists = true;
  try {
    await ctx.couch.getEntryById('orphan_attachment', 'a@a.com');
  } catch (err) {
    if (err.reason !== 'not found') {
      throw err;
    }
    exists = false;
  }

  result.addDefaultAnalysis({
    jpath: ['jpath'],
    reference: 'ref',
    metadata: {},
    attachment: {
      field: 'field',
      filename: exists ? 'second.txt' : 'first.txt',
      content_type: 'text/plain',
    },
  });

  return result;
}
