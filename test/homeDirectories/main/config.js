'use strict';

const { couchdbHost, couchdbPort, ldapAuthConfig } = require('../constants');

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  username: 'rest-on-couch',
  password: 'roc-123',
  adminPassword: 'admin',
  administrators: ['admin@a.com'],
  allowedOrigins: ['http://127.0.0.1:8080'],
  sessionSigned: false,
  customDesign: {
    views: {
      entryIdByRight: {
        map: function (doc) {
          emitWithOwner(['x', 'y', 'z'], doc.$id);
        },
        withOwner: true,
      },
      testReduce: {
        map: function (doc) {
          if (doc.$type === 'entry') {
            emit(doc._id, 1); // eslint-disable-line no-undef
          }
        },
        reduce: function (keys, values) {
          return sum(values);
        },
      },
      multiEmit: {
        map: function (doc) {
          if (doc.$type !== 'entry') {
            return;
          }
          emitWithOwner(doc.$id, 1);
          emitWithOwner(doc.$id, 2);
        },
        withOwner: true,
      },
    },
  },
  auth: {
    couchdb: {
      title: 'CouchDB authentication',
      showLogin: true,
    },
    ldap: ldapAuthConfig,
  },
  async getUserInfo(email, searchLdap) {
    if (email.endsWith('@zakodium.com')) {
      const uid = email.slice(0, email.indexOf('@'));
      const data = await searchLdap({
        filter: `uid=${uid}`,
        attributes: ['mail', 'displayName'],
      });
      return {
        email: data[0].object.mail,
        displayName: data[0].object.displayName,
      };
    } else {
      return {
        email,
        value: 42,
      };
    }
  },
  getPublicUserInfo(user) {
    return {
      displayName: user.displayName,
      email: user.mail,
    };
  },
  beforeCreateHook(document, groups) {
    const owner = document.$owners[0];
    const groupsToAdd = groups.filter(
      (group) =>
        !document.$owners.some((owner) => owner === group.name) &&
        group.users.some((user) => user === owner),
    );
    for (let group of groupsToAdd) {
      document.$owners.push(group.name);
    }
  },
};
