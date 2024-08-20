'use strict';

const debugPkg = require('debug');

const logError = debugPkg('couch:error');
const logWarning = debugPkg('couch:warn');
const logDebug = debugPkg('couch:debug');
const logTrace = debugPkg('couch:trace');

module.exports = function debug(prefix) {
  const func = (message, ...args) =>
    logDebug(`(${prefix}) ${message}`, ...args);
  func.error = (message, ...args) =>
    logError(`(${prefix}) ${message}`, ...args);
  func.warn = (message, ...args) =>
    logWarning(`(${prefix}) ${message}`, ...args);
  func.debug = func;
  func.trace = (message, ...args) =>
    logTrace(`(${prefix}) ${message}`, ...args);
  return func;
};
