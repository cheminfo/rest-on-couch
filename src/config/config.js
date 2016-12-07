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

const globalConfig = exports.getConfig();

let proxyPrefix = globalConfig.proxyPrefix;
if (!proxyPrefix.startsWith('/')) {
    proxyPrefix = '/' + proxyPrefix;
}
if (proxyPrefix.endsWith('/')) {
    proxyPrefix = proxyPrefix.replace(/\/+$/, '');
}
globalConfig.proxyPrefix = proxyPrefix;

globalConfig.publicAddress = globalConfig.publicAddress.replace(/\/+$/, '') + proxyPrefix;

exports.globalConfig = globalConfig;
