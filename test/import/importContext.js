'use strict';

const path = require('path');

const fs = require('fs-extra');

const ImportContext = require('../../src/import/ImportContext');

describe('ImportContext', () => {
  test('should instanciate a new import context', async () => {
    const file = path.join(
      __dirname,
      '../homedir/test-new-import/simple/to_process/test.txt'
    );
    const fileContents = await fs.readFileSync(file, 'utf-8');
    const databaseName = 'test-new-import';
    const ctx = new ImportContext(file, databaseName);
    expect(ctx.filename).toBe('test.txt');
    expect(ctx.fileExt).toBe('.txt');
    expect(ctx.fileDir).toMatch(
      path.normalize('homedir/test-new-import/simple/to_process')
    );
    expect(ctx.couch).toBeDefined();

    expect(await ctx.getContents('utf-8')).toBe(fileContents);
    expect(await ctx.getContents()).toEqual(Buffer.from(fileContents, 'utf-8'));
  });
});
