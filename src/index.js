'use strict';

const Couch = require('./couch');
const debug = require('./util/debug')('main');

process.on('unhandledRejection', function (err) {
  debug.error('unhandled rejection: %s', err.stack);
});

module.exports = Couch;

// must be after module.exports to avoid circular dependency
Couch.importFile = require('./import/import').import;
