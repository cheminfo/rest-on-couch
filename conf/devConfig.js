'use strict';

module.exports = {
  port: 3000,
  auth: {
    couchdb: {
      showLogin: true
    }
  },
  username: 'admin',
  password: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com'],
  sessionSigned: true,
  allowedOrigins: ['http://localhost:8080']
};
