export async function importFile(ctx, result) {
  result.id = 'multiple_jpath';
  result.kind = 'sample';
  result.owner = 'a@a.com';

  const contents = await ctx.getContents('utf-8');
  const lines = contents.split('\n').filter((line) => line.trim());

  result.skipAttachment();
  result.skipMetadata();

  for (let idx = 0; idx < lines.length; idx++) {
    result.addAttachment({
      reference: `${idx}_${ctx.filename}`,
      jpath: ['jpath', `item${idx}`],
      metadata: { value: idx },
      filename: `${idx}_${ctx.filename}`,
      contents: Buffer.from(lines[idx]),
      field: `field${idx}`,
      content_type: 'application/octet-stream',
    });
  }
}
