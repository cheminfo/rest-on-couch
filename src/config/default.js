'use strict';

module.exports = {
  // Main options
  url: 'http://127.0.0.1:5984',
  logLevel: 'FATAL',
  authRenewal: 570,
  ldapGroupsRenewal: 300,
  administrators: [],
  superAdministrators: [],

  // Server options
  port: 3000,
  fileDropPort: 3001,
  auth: {
    couchdb: {},
  },
  // Default redirect after successful or failed authentication
  // The /auth/login endpoint has redirects when the user is already authenticated.
  // The default redirect is /
  // To redirect to a specific page, bring the user to the provider's login page with the `continue` query parameter set to the desired URL.
  authRedirectUrl: '/auth/login',
  authServers: [],
  proxy: true,
  proxyPrefix: '',
  publicAddress: 'http://127.0.0.1:3000',
  keys: ['some secret'],

  sessionKey: 'roc:sess',
  sessionMaxAge: 24 * 60 * 60 * 1000, // One day
  sessionPath: '/',
  sessionSecure: false,
  sessionSigned: true,
  sessionSameSite: 'lax',

  allowedOrigins: [],
  debugrest: false,
  rights: {},
  getUserInfo(email) {
    return { email };
  },
  ldapGetUserEmail(user) {
    return user.mail;
  },
  getUserPublicInfo() {
    return null;
  },
  entryUnicity: 'byOwner', // can be byOwner or global

  // Options related to audit logs
  auditActions: false,
  auditActionsDb: 'roc-audit-actions',

  // Options for Zenodo publication
  zenodo: false,
  zenodoSandbox: false,
  zenodoToken: null,
  zenodoName: null,
  zenodoVisualizationUrl: null,
  zenodoReadme: null,
  zenodoAttachments: null,
};
