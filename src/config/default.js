'use strict';

module.exports = {
    // Main options
    url: 'http://localhost:5984',
    logLevel: 'FATAL',
    authRenewal: 570,
    autoCreateDatabase: false,
    administrators: [],
    superAdministrators: [],

    // Server options
    port: 3000,
    fileDropPort: 3001,
    auth: {
        couchdb: {}
    },
    authServers: [],
    proxy: true,
    proxyPrefix: '',
    publicAddress: 'http://localhost:3000',
    keys: ['some secret'],
    sessionMaxAge: 24 * 60 * 60 * 1000, // One day
    allowedOrigins: [],
    debugrest: false,
    rights: {},
    getUserInfo(email) {
        return {email};
    },
    entryUnicity: 'byOwner' // can be byOwner or global
};
