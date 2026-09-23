export async function importAnalyses(ctx, createEntryResult) {
  const result = createEntryResult();
  result.id = 'duplicate_filename';
  result.owner = 'a@a.com';
  result.kind = 'sample';

  // Two attachments with distinct fields but the same filename in the same jpath
  const analysis = result.addAnalysis({
    jpath: ['jpath'],
    reference: 'ref',
    metadata: {},
  });
  analysis.addAttachment({
    field: 'fieldA',
    filename: 'same.txt',
    content_type: 'text/plain',
    contents: Buffer.from('contents A', 'utf-8'),
  });
  analysis.addAttachment({
    field: 'fieldB',
    filename: 'same.txt',
    content_type: 'text/plain',
    contents: Buffer.from('contents B', 'utf-8'),
  });

  return result;
}
