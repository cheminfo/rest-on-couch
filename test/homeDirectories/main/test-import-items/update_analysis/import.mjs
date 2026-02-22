export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'update_analysis';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  let count;
  try {
    const existingEntry = await ctx.couch.getEntryById(
      'update_analysis',
      'a@a.com',
    );
    count = existingEntry.$content.count + 1;
  } catch (err) {
    if (err.reason === 'not found') {
      count = 0;
    }
  }

  // Entry content
  const content = {
    count,
    deep: {
      count,
    },
  };
  if (count === 0) {
    content.deep.other = 'other';
  }

  result.content = content;

  // Attachment metadata
  const metadata = {
    count,
    deep: {
      count,
    },
  };
  if (count === 0) {
    metadata.deep.other = 'other';
  }
  result.addDefaultAnalysis({
    jpath: ['jpath'],
    reference: 'ref',
    metadata,
    attachment: {
      field: 'field',
      content_type: 'text/plain',
    },
  });

  return result;
}
