'use strict';

const debug = require('../util/debug')('config');

const defaultConfig = require('./default');
const homeConfig = require('./home').config;
const dbConfig = require('./db');
const envConfig = require('./env');
const cliConfig = require('./cli');

exports.getConfig = function (database, customConfig) {
    debug.trace(`getConfig - db:${database}`);
    return Object.assign({}, defaultConfig, homeConfig, dbConfig[database], envConfig, cliConfig, customConfig);
};

exports.globalConfig = exports.getConfig();
