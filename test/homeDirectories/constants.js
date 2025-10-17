'use strict';

const jwt = require('jsonwebtoken');

let oidcAuthConfig;
const oidcClient = process.env.OIDC_CLIENT_ID;
const oidcClientSecret = process.env.OIDC_CLIENT_SECRET;

if (oidcClient && oidcClientSecret) {
  // This dev app is configured on entra.microsoft.com (zakodium.com organization)
  oidcAuthConfig = {
    title: 'Microsoft SSO',
    showLogin: true,
    issuer:
      'https://login.microsoftonline.com/2661e5e2-a012-441b-84ba-c046ea88d607/v2.0',
    authorizationURL:
      'https://login.microsoftonline.com/2661e5e2-a012-441b-84ba-c046ea88d607/oauth2/v2.0/authorize',
    tokenURL:
      'https://login.microsoftonline.com/2661e5e2-a012-441b-84ba-c046ea88d607/oauth2/v2.0/token',
    userInfoURL: 'https://graph.microsoft.com/oidc/userinfo',
    claims: {
      id_token: {
        tenant_ctry: { essential: true },
      },
    },
    getEmail: function getEmail({ profile, idToken }) {
      // You can customize the email extraction logic here
      const decoded = jwt.decode(idToken);
      console.log(decoded);
      // This is the default behavior
      return profile.username;
    },
    clientID: oidcClient,
    clientSecret: oidcClientSecret,
  };
}

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
  ldapAuthConfig,
  oidcAuthConfig,
};
