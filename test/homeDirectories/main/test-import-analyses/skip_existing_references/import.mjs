export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'skip_existing_references';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  // Count the imports which reached the analysis
  let count = 0;
  try {
    const existingEntry = await ctx.couch.getEntryById(
      'skip_existing_references',
      'a@a.com',
    );
    count = existingEntry.$content.jpath[0].count + 1;
  } catch (err) {
    if (err.reason !== 'not found') {
      throw err;
    }
  }

  const analysis = result.addDefaultAnalysis({
    jpath: ['jpath'],
    reference: 'ref',
    metadata: { count },
    attachment: {
      field: 'field',
      filename: `file_${count}.txt`,
      content_type: 'text/plain',
    },
  });
  analysis.skipWhenReferenceExists();

  return result;
}
