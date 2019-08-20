'use strict';

const fs = require('fs');
const path = require('path');

const rimraf = require('rimraf');

const request = require('../../setup/setup').getFileDropAgent();

const homedir = path.join(__dirname, '../../homeDirectories/main');

describe('drop file server', () => {
  afterEach(() => {
    rimraf.sync(path.join(homedir, 'test/kind1'));
  });
  test('api endpoint using query strings', () => {
    const buffer = Buffer.from('test with query strings');
    return request
      .post('/upload?kind=kind1&database=test&filename=test 123')
      .send(buffer)
      .expect(200)
      .then(() => {
        const content = fs.readFileSync(
          path.join(homedir, 'test/kind1/to_process/test 123'),
          'utf-8',
        );
        expect(content).toBe('test with query strings');
      });
  });

  test('api endpoint using path paramaters', () => {
    const buffer = Buffer.from('test with params');
    return request
      .post('/upload/test/kind1/test123')
      .send(buffer)
      .expect(200)
      .then(() => {
        const content = fs.readFileSync(
          path.join(homedir, 'test/kind1/to_process/test123'),
          'utf-8',
        );
        expect(content).toBe('test with params');
      });
  });

  test('sending a file twice should rename it with an incremental part', async () => {
    const buffer = Buffer.from('test conflict');
    const req1 = request
      .post('/upload?kind=kind1&database=test&filename=testConflict.txt')
      .send(buffer)
      .expect(200);
    await req1;
    const req2 = request
      .post('/upload?kind=kind1&database=test&filename=testConflict.txt')
      .send(buffer)
      .expect(200);
    await req2;
    const content1 = fs.readFileSync(
      path.join(homedir, 'test/kind1/to_process/testConflict.txt'),
      'utf-8',
    );
    const content2 = fs.readFileSync(
      path.join(homedir, 'test/kind1/to_process/testConflict.txt.1'),
      'utf-8',
    );
    expect(content1).toBe('test conflict');
    expect(content2).toBe('test conflict');
  });
});
