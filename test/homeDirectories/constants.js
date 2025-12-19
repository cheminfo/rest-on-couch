'use strict';

let oidcAuthConfig;
const oidcClient = process.env.OIDC_CLIENT_ID;
const oidcClientSecret = process.env.OIDC_CLIENT_SECRET;

if (oidcClient && oidcClientSecret) {
  // This dev app is configured on id.zakodium.com
  oidcAuthConfig = {
    title: 'Zakodium SSO',
    showLogin: true,
    issuer: 'https://id.zakodium.com',
    authorizationURL: 'https://id.zakodium.com/oauth/v2/authorize',
    tokenURL: 'https://id.zakodium.com/oauth/v2/token',
    userInfoURL: 'https://id.zakodium.com/oidc/v1/userinfo',
    skipUserProfile: false,
    storeProfileInSession: true,
    getEmail: function getEmail(data) {
      // You can customize the email extraction logic here
      // If data is missing from the profile, you might want to decode the jwt token directly
      // const jwt = require('jsonwebtoken');
      // const decoded = jwt.decode(data.idToken);

      const { profile } = data;
      return profile.emails?.[0]?.value;
    },
    getProfile: function getProfile(data) {
      return data.profile;
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
  getSessionProfile: function (user) {
    return {
      uid: user.uid,
      displayName: user.displayName,
    };
  },
};

module.exports = {
  ldapAuthConfig,
  oidcAuthConfig,
};
