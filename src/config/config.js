'use strict';

const debug = require('../util/debug')('config');

const defaultConfig = require('./default');
const { getHomeConfig } = require('./home');
const dbConfig = require('./db')();
const envConfig = require('./env');
const cliConfig = require('./cli');

const configStore = {};
// TODO: would be preferable if returned data was immutable to prevent side effects
function getConfig(database, customConfig) {
  debug.trace(`getConfig - db:${database}`);
  if (!configStore[database]) {
    configStore[database] = Object.assign(
      {},
      defaultConfig,
      getHomeConfig(),
      dbConfig[database],
      envConfig,
      cliConfig
    );
  }
  if (!customConfig) {
    return configStore[database];
  } else {
    return Object.assign({}, configStore[database], customConfig);
  }
}

function getImportConfig(database, importName) {
  const config = getConfig(database);
  if (!config.import || !config.import[importName]) {
    throw new Error(`no import config for ${database}/${importName}`);
  }
  if (typeof config.import[importName] !== 'function') {
    throw new TypeError('import config must be a function');
  }
  return config.import[importName];
}

const globalConfig = getConfig();

let proxyPrefix = globalConfig.proxyPrefix;
if (!proxyPrefix.startsWith('/')) {
  proxyPrefix = `/${proxyPrefix}`;
}
if (proxyPrefix.endsWith('/')) {
  proxyPrefix = proxyPrefix.replace(/\/+$/, '');
}
globalConfig.proxyPrefix = proxyPrefix;

globalConfig.publicAddress =
  globalConfig.publicAddress.replace(/\/+$/, '') + proxyPrefix;

module.exports = {
  getConfig,
  getImportConfig,
  globalConfig
};
