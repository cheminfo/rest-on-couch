'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const request = require('../../setup/setup').getFileDropAgent();

const homedir = path.join(__dirname, '../../homeDirectories/main');

describe('drop file server', () => {
  afterEach(() =>
    fs.rm(path.join(homedir, 'test/kind1'), {
      recursive: true,
    }),
  );
  test('api endpoint using query strings', async () => {
    const buffer = Buffer.from('test with query strings');
    await request
      .post('/upload?kind=kind1&database=test&filename=test 123')
      .send(buffer)
      .expect(200);

    const content = await fs.readFile(
      path.join(homedir, 'test/kind1/to_process/test 123'),
      'utf-8',
    );
    expect(content).toBe('test with query strings');
  });

  test('api endpoint using path paramaters', async () => {
    const buffer = Buffer.from('test with params');
    await request.post('/upload/test/kind1/test123').send(buffer).expect(200);

    const content = await fs.readFile(
      path.join(homedir, 'test/kind1/to_process/test123'),
      'utf-8',
    );
    expect(content).toBe('test with params');
  });

  test('sending a file twice should rename it with an incremental part', async () => {
    const buffer = Buffer.from('test conflict');
    await request
      .post('/upload?kind=kind1&database=test&filename=testConflict.txt')
      .send(buffer)
      .expect(200);
    await request
      .post('/upload?kind=kind1&database=test&filename=testConflict.txt')
      .send(buffer)
      .expect(200);
    const content1 = await fs.readFile(
      path.join(homedir, 'test/kind1/to_process/testConflict.txt'),
      'utf-8',
    );
    const content2 = await fs.readFile(
      path.join(homedir, 'test/kind1/to_process/testConflict.txt.1'),
      'utf-8',
    );
    expect(content1).toBe('test conflict');
    expect(content2).toBe('test conflict');
  });
});
