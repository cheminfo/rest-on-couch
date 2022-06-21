'use strict';

const debugPkg = require('debug');

const error = debugPkg('couch:error');
const warn = debugPkg('couch:warn');
const debug = debugPkg('couch:debug');
const trace = debugPkg('couch:trace');

module.exports = function (prefix) {
  const func = (message, ...args) => debug(`(${prefix}) ${message}`, ...args);
  func.error = (message, ...args) => error(`(${prefix}) ${message}`, ...args);
  func.warn = (message, ...args) => warn(`(${prefix}) ${message}`, ...args);
  func.debug = func;
  func.trace = (message, ...args) => trace(`(${prefix}) ${message}`, ...args);
  return func;
};
