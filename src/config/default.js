'use strict';

module.exports = {
    url: 'http://localhost:5984',
    logLevel: 'WARN',
    auth: {
        couchdb: {}
    },
    port: 3000,
    authServers: [],
    proxy: true,
    proxyPrefix: '/',
    authRenewal: 1900000
};
