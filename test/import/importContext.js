'use strict';

const ImportContext = require('../../src/import/ImportContext');
const fs = require('fs-extra');
const path = require('path');
const Couch = require('../..');

describe('ImportContext', () => {
  test('should instanciate a new import context', async () => {
    const file = path.join(
      __dirname,
      '../homedir/test-new-import/simple/to_process/test.txt'
    );
    const fileContents = await fs.readFileSync(file, 'utf-8');
    const databaseName = 'test-new-import';
    const ctx = new ImportContext(file, databaseName);
    ctx.filename.should.equal('test.txt');
    ctx.fileExt.should.equal('.txt');
    ctx.fileDir.should.endWith('homedir/test-new-import/simple/to_process');
    ctx.couch.should.be.an.instanceOf(Couch);

    (await ctx.getContents('utf-8')).should.equal(fileContents);
    (await ctx.getContents()).should.deepEqual(
      Buffer.from(fileContents, 'utf-8')
    );
  });
});
