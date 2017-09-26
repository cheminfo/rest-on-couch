'use strict';

module.exports = {
    auth: {
        couchdb: {
            showLogin: true
        }
    },
    username: 'admin',
    password: 'admin',
    // Already administrator from global configuration
    superAdministrators: ['admin@a.com', 'a@a.com'],
    autoCreateDatabase: true,
    allowedOrigins: ['http://localhost:8080'],
};