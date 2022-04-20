'use strict';

const couchdbHost = process.env.COUCHDB_HOST || 'localhost';
const couchdbPort = process.env.COUCHDB_PORT || '5984';

const ldapAuthConfig = {
  server: {
    url: process.env.REST_ON_COUCH_LDAP_URL,
    searchBase: 'dc=zakodium,dc=com',
    searchFilter: 'uid={{username}}',
    bindDN: process.env.REST_ON_COUCH_LDAP_BIND_D_N,
    bindCredentials: process.env.REST_ON_COUCH_LDAP_BIND_PASSWORD,
  },
  getUserInfo: function (user) {
    return {
      uid: user.uid[0],
    };
  },
};

module.exports = {
  couchdbHost,
  couchdbPort,
  ldapAuthConfig,
};
