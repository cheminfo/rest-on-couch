'use strict';

const nano = require('nano');

const config = require('./config/config').globalConfig;
const CouchError = require('./util/CouchError');
const debug = require('./util/debug')('main:connect');
const nanoPromise = require('./util/nanoPromise');

let authInterval;
let globalNano;

async function open() {
    if (globalNano) {
        return globalNano;
    }
    authInterval = setInterval(() => {
        globalNano = getGlobalNano();
    }, config.authRenewal * 1000);
    return globalNano = getGlobalNano();
}

async function getGlobalNano() {
    debug('initialize connection to CouchDB');
    if (config.url && config.username && config.password) {
        debug.trace('config is complete');
        let _nano = nano(config.url);
        const cookie = await nanoPromise.authenticate(
            _nano,
            config.username,
            config.password
        );
        return nano({
            url: config.url,
            cookie
        });
    } else {
        throw new CouchError('rest-on-couch cannot be used without url, username and password', 'fatal');
    }
}

function close() {
    clearInterval(authInterval);
    authInterval = null;
    globalNano = null;
}

module.exports = {
    open,
    close
};
