'use strict';

const Couch = require('./couch');
const debug = require('./util/debug')('main');

process.on('unhandledRejection', function (err) {
  debug.error(`unhandled rejection: ${err.stack}`);
});

module.exports = Couch;

// must be after module.exports to avoid circular dependency
Couch.importData = require('./import/import').import;
