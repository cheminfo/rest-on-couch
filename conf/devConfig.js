'use strict';

module.exports = {
    auth: {
        couchdb: {
            showLogin: true
        }
    },
    username: 'admin',
    password: 'admin',
    administrators: ['admin@a.com'],
    autoCreateDatabase: true,
    allowedOrigins: ['http://localhost:8080'],
};