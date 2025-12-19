'use strict';

const debug = require('../util/debug')('config');

const cliConfig = require('./cli');
const { getDbConfigOrDie } = require('./db');
const getEnvConfig = require('./env');
const { getHomeConfig } = require('./home');
const { configSchema } = require('./schema.mjs');
const { getConfigGlobal } = require('./global.mjs');

const configStore = {};
let homeConfig;
let dbConfig;

const noDbKey = Symbol('noDbKey');

function getConfig(database, customConfig = undefined) {
  homeConfig ??= getHomeConfig();
  dbConfig ??= getDbConfigOrDie();
  const globalConfig = getConfigGlobal();
  debug.trace('getConfig - db: %s', database);

  if (!customConfig) {
    if (!configStore[database]) {
      configStore[database] = configSchema.parse({
        ...globalConfig,
        ...homeConfig,
        ...dbConfig[database],
        ...getEnvConfig(),
        ...cliConfig,
      });
    }
    return configStore[database];
  } else {
    const final = {
      ...globalConfig,
      ...homeConfig,
      ...dbConfig[database],
      ...getEnvConfig(),
      ...cliConfig,
      ...customConfig,
    };
    return configSchema.parse(final);
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

function getGlobalConfig(customConfig) {
  return getConfig(noDbKey, customConfig);
}

module.exports = {
  getConfig,
  getImportConfig,
  getGlobalConfig,
};
