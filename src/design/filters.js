'use strict';

/* istanbul ignore file  */

const filters = module.exports;

filters.logs = function(doc) {
  return doc.$type === 'log';
};
