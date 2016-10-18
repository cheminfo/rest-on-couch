'use strict';

const path = require('path');

const debug = require('../util/debug')('config:cli');
const die = require('../util/die');

// Get optional --config (or -c) CLI option
const cliArguments = require('minimist')(process.argv.slice(2));
module.exports = loadCliConfig(cliArguments.c || cliArguments.config);

function loadCliConfig(source) {
    if (!source) {
        debug('no cli config');
        return {};
    }
    source = path.resolve(source);
    try {
        return require(source);
    } catch (e) {
        return die(`could not load custom config from ${source}`);
    }
}
