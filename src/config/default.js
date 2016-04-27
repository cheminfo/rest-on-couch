'use strict';

module.exports = {
    // Main options
    url: 'http://localhost:5984',
    logLevel: 'WARN',
    authRenewal: 570,
    autoCreateDatabase: false,

    // Server options
    port: 3000,
    fileDropPort: 3001,
    auth: {
        couchdb: {}
    },
    authServers: [],
    proxy: true,
    proxyPrefix: '/',
    allowedOrigins: [],
    debugrest: false
};
