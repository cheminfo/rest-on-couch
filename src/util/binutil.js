'use strict';

const path = require('path');

exports.loadConfig = function (program) {
    if (!program.config) {
        throw new Error('config option is mandatory');
    }
    return require(path.resolve(program.config));
};
