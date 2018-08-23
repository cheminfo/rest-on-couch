'use strict';
const path = require('path');

const dbConfig = require('../../src/config/db');

process.stderr.write = () => {};
// Avoid the call to dbConfig to crash the process
process.exit = () => {};
test('loading configuration that has duplicate', () => {
  const exit = jest.spyOn(process, 'exit');
  dbConfig(path.join(__dirname, '../homeDirectories/failDuplicateView'));
  expect(exit).toHaveBeenCalledWith(1);
});
