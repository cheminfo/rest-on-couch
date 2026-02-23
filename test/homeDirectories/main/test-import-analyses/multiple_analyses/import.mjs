export async function importAnalyses(ctx, createEntryImport) {
  const entry = createEntryImport();
  entry.id = 'multiple_analyses';
  entry.kind = 'sample';
  entry.owner = 'a@a.com';
  entry.addGroup('group1');
  entry.addGroups(['group2', 'group3']);
  entry.content = {
    sideEffect: true,
  };

  const contents = await ctx.getContents('utf-8');
  const lines = contents.split('\n').filter((line) => line.trim());

  for (let idx = 0; idx < lines.length; idx++) {
    const analysis = entry.addAnalysis({
      reference: `${idx}_${ctx.filename}`,
      jpath: ['jpath', 'in', 'document'],
      metadata: { value: idx },
    });

    analysis.addAttachment({
      filename: `${idx}_${ctx.filename}`,
      contents: Buffer.from(lines[idx], 'utf-8'),
      content_type: 'text/plain',
      field: `field${idx}`,
    });
  }

  return entry;
}
