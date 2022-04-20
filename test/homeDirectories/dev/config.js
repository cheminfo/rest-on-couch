'use strict';

const {couchdbHost, couchdbPort, ldapAuthConfig} = require('../constants')

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  port: 3000,
  auth: {
    couchdb: {
      showLogin: true,
    },
    ldap: ldapAuthConfig,
  },
  username: 'admin',
  password: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com', 'admin@zakodium.com'],
  sessionSigned: true,
  allowedOrigins: ['http://localhost:8080'],
  getUserInfo: function (user) {
    return {
      uid: user.uid,
      displayName: user.displayName,
    };
  },
};
