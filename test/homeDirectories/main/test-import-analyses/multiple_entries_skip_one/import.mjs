export function importAnalyses(ctx, createEntryResult) {
  const entry1 = createEntryResult();
  entry1.id = 'entry1';
  entry1.kind = 'sample';
  entry1.owner = 'a@a.com';

  entry1.addDefaultAnalysis({
    jpath: ['jpath'],
    reference: 'entry1',
    metadata: {},
    attachment: {
      field: 'field',
      content_type: 'text/plain',
    },
  });

  const entry2 = createEntryResult();
  entry2.skip();

  return [entry1, entry2];
}
