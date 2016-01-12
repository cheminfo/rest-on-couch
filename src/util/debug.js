'use strict';

const Debug = require('debug');

const error = Debug('couch:error');
const warn = Debug('couch:warn');
const debug = Debug('couch:debug');
const trace = Debug('couch:trace');

module.exports = function (prefix) {
    const func = message => debug(`(${prefix}) ${message}`);
    func.error = message => error(`(${prefix}) ${message}`);
    func.warn = message => warn(`(${prefix}) ${message}`);
    func.debug = func;
    func.trace = message => trace(`(${prefix}) ${message}`);
    return func;
};
