'use strict';

/* eslint-disable no-undef */

const couchdbHost = process.env.COUCHDB_HOST || 'localhost';
const couchdbPort = process.env.COUCHDB_PORT || '5984';

module.exports = {
  url: `http://${couchdbHost}:${couchdbPort}`,
  username: 'admin',
  password: 'admin',
  administrators: ['admin@a.com'],
  allowedOrigins: ['http://localhost:8080'],
  sessionSigned: false,
  customDesign: {
    views: {
      entryIdByRight: {
        map: function(doc) {
          emitWithOwner(['x', 'y', 'z'], doc.$id);
        },
        withOwner: true,
      },
      testReduce: {
        map: function(doc) {
          if (doc.$type === 'entry') {
            emit(doc._id, 1); // eslint-disable-line no-undef
          }
        },
        reduce: function(keys, values) {
          return sum(values);
        },
      },
      multiEmit: {
        map: function(doc) {
          if (doc.$type !== 'entry') {
            return;
          }
          emitWithOwner(doc.$id, 1);
          emitWithOwner(doc.$id, 2);
        },
        withOwner: true,
      }
    },
  },
  auth: {
    couchdb: {
      title: 'CouchDB authentication',
      showLogin: true,
    },
  },
  getUserInfo(email) {
    return Promise.resolve({
      email,
      value: 42,
    });
  },
};
