'use strict';

const couchdbHost = process.env.COUCHDB_HOST || 'localhost';
const couchdbPort = process.env.COUCHDB_PORT || '5984';

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
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
