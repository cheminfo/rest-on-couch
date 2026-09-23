export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'duplicate_filename_two_steps';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  // On the second import of the same reference, a different field targets
  // the same filename in the same jpath as the first import
  let exists = true;
  try {
    await ctx.couch.getEntryById('duplicate_filename_two_steps', 'a@a.com');
  } catch (err) {
    if (err.reason !== 'not found') {
      throw err;
    }
    exists = false;
  }

  const analysis = result.addAnalysis({
    jpath: ['jpath'],
    reference: 'ref',
    metadata: {},
  });
  analysis.addAttachment({
    field: exists ? 'fieldB' : 'fieldA',
    filename: 'same.txt',
    content_type: 'text/plain',
    contents: Buffer.from(exists ? 'contents B' : 'contents A', 'utf-8'),
  });

  return result;
}
