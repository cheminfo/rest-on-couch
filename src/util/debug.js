'use strict';

const Debug = require('debug');

const error = Debug('couch:error');
const warn = Debug('couch:warn');
const debug = Debug('couch:debug');
const trace = Debug('couch:trace');

module.exports = function (prefix) {
    const func = (...args) => debug(`(${prefix}) ${processArgs(args)}`);
    func.error = (...args) => error(`(${prefix}) ${processArgs(args)}`);
    func.warn = (...args) => warn(`(${prefix}) ${processArgs(args)}`);
    func.debug = func;
    func.trace = (...args) => trace(`(${prefix}) ${processArgs(args)}`);
    return func;
};

function processArgs(args) {
    args = args.map(arg => {
        if (arg instanceof Error) {

            return `${arg.message}\n${arg.stack}`;
        }
        return arg;
    });
    return args.join('\n');
}
