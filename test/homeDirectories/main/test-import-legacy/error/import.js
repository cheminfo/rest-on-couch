'use strict';

module.exports = async function errorImport() {
  throw new Error('this import is wrong');
};
