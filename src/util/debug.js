'use strict';

const Debug = require('debug');

const error = Debug('couch:error');
const warn = Debug('couch:warn');
const debug = Debug('couch:debug');
const trace = Debug('couch:trace');

module.exports = function(prefix) {
  const func = (message, ...args) => debug(`(${prefix}) ${message}`, ...args);
  func.error = (message, ...args) => error(`(${prefix}) ${message}`, ...args);
  func.warn = (message, ...args) => warn(`(${prefix}) ${message}`, ...args);
  func.debug = func;
  func.trace = (message, ...args) => trace(`(${prefix}) ${message}`, ...args);
  return func;
};
