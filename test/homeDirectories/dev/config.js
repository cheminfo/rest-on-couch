'use strict';

const { ldapAuthConfig, oidcAuthConfig } = require('../constants');

module.exports = {
  port: 3300,
  auth: {
    couchdb: {
      showLogin: true,
    },
    ldap: ldapAuthConfig,
    oidc: oidcAuthConfig,
  },
  keys: ['app-key'],
  password: 'roc-123',
  adminPassword: 'admin',
  // Already administrator from global configuration
  superAdministrators: ['admin@a.com', 'a@a.com', 'admin@zakodium.com'],
  publicAddress: 'http://127.0.0.1:3300',
  allowedOrigins: ['http://127.0.0.1:3309', 'http://localhost:3309'],
  getPublicUserInfo(user) {
    return {
      displayName: user.displayName,
      email: user.mail,
    };
  },
};
