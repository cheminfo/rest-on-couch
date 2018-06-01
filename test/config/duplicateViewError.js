'use strict';
const path = require('path');

const dbConfig = require('../../src/config/db');

process.exit = function () {};
test('loading configuration that has duplicate', () => {
  const exit = jest.spyOn(process, 'exit');
  dbConfig(path.join(__dirname, '../homeDirectories/failDuplicateView'));
  expect(exit).toHaveBeenCalledWith(1);
});
