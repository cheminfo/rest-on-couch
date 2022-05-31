'use strict';

const fs = require('fs');
const path = require('path');

const ImportContext = require('../../../src/import/ImportContext');

describe('ImportContext', () => {
  test('should instanciate a new import context', async () => {
    const file = path.join(
      __dirname,
      '../../homeDirectories/main/test-new-import/full/to_process/test.txt',
    );
    const fileContents = await fs.readFileSync(file, 'utf-8');
    const databaseName = 'test-new-import';
    const ctx = new ImportContext(file, databaseName);
    expect(ctx.filename).toBe('test.txt');
    expect(ctx.fileExt).toBe('.txt');
    expect(ctx.fileDir).toMatch(
      path.normalize('homeDirectories/main/test-new-import/full/to_process'),
    );
    expect(ctx.couch).toBeDefined();
    await ctx.couch.open();
    const fileContentsUtf8 = await ctx.getContents('utf-8');
    expect(fileContentsUtf8).toBe(fileContents);

    const dataBuffer = await ctx.getContents();
    expect(dataBuffer).toEqual(Buffer.from(fileContents, 'utf-8'));
  });
});
