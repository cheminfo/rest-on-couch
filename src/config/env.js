'use strict';

const prefix = 'REST_ON_COUCH_';
const debug = require('../util/debug')('roc:env-config');

function getEnvConfig() {
  const envConfig = {};
  for (const name in process.env) {
    if (name.startsWith(prefix)) {
      const realName = name
        .substring(prefix.length)
        .toLowerCase()
        .replace(/_(?<part>[a-z])/g, (value) => {
          return value[1].toUpperCase();
        });

      debug('setting config from env, %s', realName);
      envConfig[realName] = process.env[name];
    }
  }
  return envConfig;
}

module.exports = getEnvConfig;
