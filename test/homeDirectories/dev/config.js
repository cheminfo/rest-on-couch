'use strict';

const {
  couchdbHost,
  couchdbPort,
  ldapAuthConfig,
  oidcAuthConfig,
} = require('../constants');

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  port: 3300,
  auth: {
    couchdb: {
      showLogin: true,
    },
    ldap: ldapAuthConfig,
    oidc: oidcAuthConfig,
  },
  username: 'rest-on-couch',
  password: 'roc-123',
  adminPassword: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com', 'admin@zakodium.com'],
  sessionSigned: true,
  publicAddress: 'http://localhost:3300',
  allowedOrigins: ['http://127.0.0.1:3309', 'http://localhost:3309'],
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
