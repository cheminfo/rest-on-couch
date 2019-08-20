'use strict';

/* eslint-disable no-undef */

module.exports = {
  url: `http://${process.env.COUCHDB_HOST || 'localhost'}:5984`,
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
