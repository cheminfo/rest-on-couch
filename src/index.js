'use strict';

const Couch = require('./couch');
const debug = require('./util/debug')('main');

process.on('unhandledRejection', function handleUnhandledRejection(err) {
  debug.error('unhandled rejection: %s', err.stack);
});

module.exports = Couch;
