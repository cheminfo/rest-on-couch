'use strict';

module.exports = async function separateImport(ctx, result) {
  result.kind = 'sample';
  result.id = 'separate';
  result.owner = 'a@a.com';
  result.reference = ctx.filename;
  result.skipAttachment();
  result.skipMetadata();
  result.field = 'field';
  if (ctx.fileExt === '.txt') {
    result.content_type = 'text/plain';
  }
  result.content = {
    sideEffect: true,
  };
  result.addAttachment({
    jpath: ['other', 'jpath'],
    metadata: { hasMetadata: true },
    reference: 'testRef',
    contents: await ctx.getContents(),
    field: 'testField',
    filename: ctx.filename,
    content_type: 'text/plain',
  });
  result.addAttachment({
    jpath: ['other2', 'jpath'],
    reference: 'ref2',
    // no metadata
    contents: Uint8Array.of(116, 101, 115, 116, 50),
    field: 'testField',
    filename: 'test2.txt',
    content_type: 'text/plain',
  });
  result.metadata = {
    hasMetadata2: true,
  };
  result.addGroup('group1');
  result.addGroups(['group2', 'group3']);
};
