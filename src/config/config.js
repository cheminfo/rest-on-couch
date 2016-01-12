'use strict';

const debug = require('../util/debug')('config');

const defaultConfig = require('./default');
const homeConfig = require('./home').config;
const mainConfig = require('./main');
const dbConfig = require('./db');
const envConfig = require('./env');
const cliConfig = require('./cli');

exports.getConfig = function (database, customConfig) {
    debug.trace(`getConfig - db:${database}`);
    return Object.assign({}, defaultConfig, homeConfig, mainConfig, dbConfig[database], envConfig, cliConfig, customConfig);
};

exports.globalConfig = exports.getConfig();
