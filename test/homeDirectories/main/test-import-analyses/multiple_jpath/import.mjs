export async function importAnalyses(ctx, createEntryImport) {
  const entry = createEntryImport();
  entry.id = 'multiple_jpath';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';

  const contents = await ctx.getContents('utf-8');
  const lines = contents.split('\n').filter((line) => line.trim());

  for (let idx = 0; idx < lines.length; idx++) {
    const analysis = entry.addAnalysis({
      reference: `${idx}_${ctx.filename}`,
      jpath: ['jpath', `item${idx}`],
      metadata: { value: idx },
    });

    analysis.addAttachment({
      filename: `${idx}_${ctx.filename}`,
      contents: Buffer.from(lines[idx]),
      field: `field${idx}`,
    });
  }

  return entry;
}
