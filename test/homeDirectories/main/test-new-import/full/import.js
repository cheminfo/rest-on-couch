'use strict';

module.exports = async function fullImport(ctx, result) {
  result.kind = 'sample';
  result.id = ctx.filename;
  result.owner = 'a@a.com';
  result.reference = ctx.filename;
  result.field = 'field';
  result.jpath = ['jpath', 'in', 'document'];
  if (ctx.fileExt === '.txt') {
    result.content_type = 'text/plain';
  }
  result.content = {
    sideEffect: true,
  };

  const buffer = Buffer.from('other attachment content!!', 'utf-8');

  const contents = new Uint8Array(buffer.buffer, 0, buffer.length - 2);
  result.addAttachment({
    jpath: ['other', 'jpath'],
    metadata: { hasMetadata: true },
    reference: 'testRef',
    contents,
    field: 'testField',
    filename: 'testFilename.txt',
    content_type: 'text/plain',
  });
  result.metadata = {
    hasMetadata: true,
  };
  result.addGroup('group1');
  result.addGroups(['group2', 'group3']);
};
