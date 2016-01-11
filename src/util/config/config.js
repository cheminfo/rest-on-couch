'use strict';

const defaultConfig = require('./default');
const homeConfig = require('./home').config;
const mainConfig = require('./main');
const dbConfig = require('./db');
const envConfig = require('./env');
const cliConfig = require('./cli');

exports.getConfig = function (database, customConfig) {
    return Object.assign({}, defaultConfig, homeConfig, mainConfig, dbConfig[database], envConfig, cliConfig, customConfig);
};

exports.globalConfig = exports.getConfig();
