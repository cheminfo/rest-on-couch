export async function importAnalyses(ctx, createEntryImport) {
  const entry = createEntryImport();
  entry.id = 'multiple_analysis_attachments';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';

  const fileData = await ctx.getContents('utf-8');
  const [line1, line2] = fileData.split('\n');

  const analysis = entry.addDefaultAnalysis({
    jpath: ['spectra', 'nmr'],
    metadata: { isFT: true, isFid: true },
    reference: ctx.filename,
    attachment: {
      content_type: 'text/plain',
      field: 'full',
      filename: 'full.txt',
    },
  });

  analysis.addAttachment({
    filename: 'FID.txt',
    field: 'FID',
    content_type: 'text/plain',
    contents: Buffer.from(line1, 'utf-8'),
  });

  analysis.addAttachment({
    filename: 'FT.txt',
    field: 'FT',
    content_type: 'text/plain',
    contents: Buffer.from(line2, 'utf-8'),
  });

  return entry;
}
