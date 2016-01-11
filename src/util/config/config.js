'use strict';

const mainConfig = require('./main');
const dbConfig = require('./db');
const envConfig = require('./env');
const cliConfig = require('./cli');

exports.getConfig = function (database, config) {
    return Object.assign({}, mainConfig, dbConfig[database], envConfig, cliConfig, config);
};
