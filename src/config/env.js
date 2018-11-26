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
    debug('setting config from env, %s: %s', realName, process.env[name]);
    envConfig[realName] = process.env[name];
  }
}

module.exports = envConfig;
