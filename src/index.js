'use strict';

const debug = require('./util/debug')('main');
const Couch = require('./couch');
const importFile = require('./import/import');
const globalConfig = require('./config/config').globalConfig;
const CouchError = require('./util/CouchError');

process.on('unhandledRejection', function (err) {
  debug.error('unhandled rejection: %s', err.stack);
});

module.exports = {
  Couch,
  globalConfig,
  importFile,
  CouchError
};
