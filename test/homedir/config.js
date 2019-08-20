'use strict';

module.exports = {
  url: `http://${process.env.COUCHDB_HOST || 'localhost'}:5984`,
  port: 3000,
  auth: {
    couchdb: {
      showLogin: true,
    },
  },
  username: 'admin',
  password: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com'],
  sessionSigned: true,
  allowedOrigins: ['http://localhost:8080'],
};
