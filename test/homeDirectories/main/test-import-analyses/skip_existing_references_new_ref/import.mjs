export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'skip_existing_references_new_ref';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  // Use a new reference on every import
  let count = 0;
  try {
    const existingEntry = await ctx.couch.getEntryById(
      'skip_existing_references_new_ref',
      'a@a.com',
    );
    count = existingEntry.$content.jpath.length;
  } catch (err) {
    if (err.reason !== 'not found') {
      throw err;
    }
  }

  const analysis = result.addDefaultAnalysis({
    jpath: ['jpath'],
    reference: `ref_${count}`,
    metadata: {},
    attachment: {
      field: 'field',
      filename: `file_${count}.txt`,
      content_type: 'text/plain',
    },
  });
  analysis.skipWhenReferenceExists();

  return result;
}
