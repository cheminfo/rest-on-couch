'use strict';

module.exports = {
    // Main options
    url: 'http://localhost:5984',
    logLevel: 'FATAL',
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
    keys: ['some secret'],
    sessionMaxAge: 24 * 60 * 60 * 1000, // One day
    allowedOrigins: [],
    debugrest: false
};
