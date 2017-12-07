'use strict';

const nano = require('nano');

const config = require('./config/config').globalConfig;
const CouchError = require('./util/CouchError');
const debug = require('./util/debug')('main:connect');
const nanoPromise = require('./util/nanoPromise');

const agentkeepalive = require('agentkeepalive');
const nanoAgent = new agentkeepalive({
    maxSockets: 50,
    maxKeepAliveRequests: 0,
    maxKeepAliveTime: 20000
});


const authRenewal = config.authRenewal * 1000;

let globalNano;
let lastAuthentication = 0;

async function open() {
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
    if (config.url && config.username && config.password) {
        let _nano = nano({
            url: config.url,
            requestDefaults: {
                agent: nanoAgent
            }
        });
        const cookie = await nanoPromise.authenticate(
            _nano,
            config.username,
            config.password
        );
        return nano({
            url: config.url,
            cookie,
            requestDefaults: {
                agent: nanoAgent
            }
        });
    } else {
        throw new CouchError('rest-on-couch cannot be used without url, username and password', 'fatal');
    }
}

function close() {
    globalNano = null;
}

module.exports = {
    open,
    close
};
