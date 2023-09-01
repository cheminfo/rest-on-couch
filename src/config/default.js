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
