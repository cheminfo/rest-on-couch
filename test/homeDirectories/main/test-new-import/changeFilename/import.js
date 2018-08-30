'use strict';

module.exports = async function importFunction(ctx, result) {
  result.kind = 'sample';
  result.id = ctx.filename;
  result.filename = 'newFilename.txt';
  result.owner = 'a@a.com';
  result.reference = ctx.filename;
  result.field = 'field';
  result.jpath = ['jpath', 'in', 'document'];
  if (ctx.fileExt === '.txt') {
    result.content_type = 'plain/text';
  }
  result.metadata = {
    hasMetadata: true
  };
};
