'use strict';

const couchdbHost = process.env.COUCHDB_HOST || 'localhost';
const couchdbPort = process.env.COUCHDB_PORT || '5984';

const ldapConfig = {
  server: {
    url: process.env.REST_ON_COUCH_LDAP_URL,
    searchBase: 'dc=zakodium,dc=com',
    searchFilter: 'uid={{username}}',
    bindDN: process.env.REST_ON_COUCH_LDAP_BIND_DN,
    bindCredentials: process.env.REST_ON_COUCH_LDAP_BIND_CREDENTIALS,
  },
  getUserInfo: function (user) {
    return {
      uid: user.uid[0],
    };
  },
};

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  port: 3000,
  auth: {
    couchdb: {
      showLogin: true,
    },
    ldap: ldapConfig,
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
