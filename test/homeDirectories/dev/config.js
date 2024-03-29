'use strict';

const { couchdbHost, couchdbPort, ldapAuthConfig } = require('../constants');

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  port: 3000,
  auth: {
    couchdb: {
      showLogin: true,
    },
    ldap: ldapAuthConfig,
  },
  username: 'rest-on-couch',
  password: 'roc-123',
  adminPassword: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com', 'admin@zakodium.com'],
  sessionSigned: true,
  allowedOrigins: ['http://127.0.0.1:8080'],
  getUserInfo: function (user) {
    return {
      uid: user.uid,
      displayName: user.displayName,
    };
  },
  getPublicUserInfo(user) {
    return {
      displayName: user.displayName,
      email: user.mail,
    };
  },
};
