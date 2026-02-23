export async function importFile(ctx, result) {
  result.id = 'multiple_analysis_attachments';
  result.kind = 'sample';
  result.owner = 'a@a.com';
  result.jpath = ['spectra', 'nmr'];
  result.metadata = { isFT: true, isFid: true };
  result.reference = ctx.filename;
  result.field = 'full';
  result.content_type = 'text/plain';
  result.filename = 'full.txt';
  const fileData = await ctx.getContents('utf-8');
  const [line1, line2] = fileData.split('\n');

  result.addAttachment({
    jpath: ['spectra', 'nmr'],
    reference: ctx.filename,
    filename: 'FID.txt',
    field: 'FID',
    content_type: 'text/plain',
    contents: Buffer.from(line1, 'utf-8'),
  });

  result.addAttachment({
    jpath: ['spectra', 'nmr'],
    reference: ctx.filename,
    filename: 'FT.txt',
    field: 'FT',
    content_type: 'text/plain',
    contents: Buffer.from(line2, 'utf-8'),
  });
}
