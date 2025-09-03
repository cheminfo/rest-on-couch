'use strict';

const { getGlobalConfig } = require('./config/config');
const CouchError = require('./util/CouchError');
const debug = require('./util/debug')('main:connect');
const getNano = require('./util/nanoShim');

let globalNano;
let lastAuthentication = 0;

function open() {
  const authRenewal = getGlobalConfig().authRenewal * 1000;
  const currentDate = Date.now();
  if (currentDate - lastAuthentication > authRenewal) {
    if (lastAuthentication === 0) {
      debug('initialize connection to CouchDB');
    }
    globalNano = getGlobalNano();
    lastAuthentication = currentDate;
  }
  return globalNano;
}

async function getGlobalNano() {
  debug.trace('renew CouchDB cookie');
  const config = getGlobalConfig();
  if (config.url && config.username && config.password) {
    return getNano(config.url, config.username, config.password);
  } else {
    throw new CouchError(
      'rest-on-couch cannot be used without url, username and password',
      'fatal',
    );
  }
}

function close() {
  globalNano = null;
}

module.exports = {
  open,
  close,
};
