/* eslint-disable no-process-env */
'use strict';

const prefix = 'REST_ON_COUCH_';
const debug = require('../util/debug')('roc:env-config');

const envConfig = {};
for (const name in process.env) {
  if (name.startsWith(prefix)) {
    const realName = name
      .substring(prefix.length)
      .toLowerCase()
      .replace(/_([a-z])/g, function (value) {
        return value[1].toUpperCase();
      });

    let envValue = process.env[name];
    if (envValue === 'true') {
      envValue = true;
    } else if (envValue === 'false') {
      envValue = false;
    }

    debug('setting config from env, %s: %s', realName, envValue);
    envConfig[realName] = envValue;
  }
}

module.exports = envConfig;
