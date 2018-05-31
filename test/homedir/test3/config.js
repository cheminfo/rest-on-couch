'use strict';

module.exports = {
  customDesign: {
    version: 8,
    views: {
      lib: {
        test: ['lib.js']
      },
      test: {
        map: function (doc) {
          const libTest = require('views/lib/test');
          if (doc.$type === 'entry') {
            emit(doc._id, libTest.fortyTwo());
          }
        }
      }
    },
    updates: {},
    filters: {
      abc: function (doc) {
        return doc.$type === 'log';
      }
    }
  },
  entryUnicity: 'global'
};
