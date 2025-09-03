'use strict';

const debug = require('../util/debug')('config');

const cliConfig = require('./cli');
const { getDbConfigOrDie } = require('./db');
const defaultConfig = require('./default');
const getEnvConfig = require('./env');
const { getHomeConfig } = require('./home');

let dbConfig;
const configStore = {};

function getConfig(database, customConfig) {
  dbConfig ??= getDbConfigOrDie();
  debug.trace('getConfig - db: %s', database);
  const homeConfig = getHomeConfig();
  if (!configStore[database]) {
    configStore[database] = {
      ...defaultConfig,
      ...homeConfig,
      ...dbConfig[database],
      ...getEnvConfig(),
      ...cliConfig,
    };
  }

  if (!customConfig) {
    return configStore[database];
  } else {
    return { ...configStore[database], ...customConfig };
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

let globalConfig;

function getGlobalConfig() {
  if (globalConfig) {
    return globalConfig;
  }

  globalConfig = getConfig();
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

  return globalConfig;
}

module.exports = {
  getConfig,
  getImportConfig,
  getGlobalConfig,
};
