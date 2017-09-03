'use strict';

const Debug = require('debug');

const error = Debug('couch:error');
const warn = Debug('couch:warn');
const debug = Debug('couch:debug');
const trace = Debug('couch:trace');

module.exports = function (prefix) {
    const func = (...args) => debug(`(${prefix}) ${args.join('\n')}`);
    func.error = (...args) => error(`(${prefix}) ${args.join('\n')}`);
    func.warn = (...args) => warn(`(${prefix}) ${args.join('\n')}`);
    func.debug = func;
    func.trace = (...args) => trace(`(${prefix}) ${args.join('\n')}`);
    return func;
};
