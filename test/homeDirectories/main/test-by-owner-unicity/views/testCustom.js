'use strict';

module.exports = {
  testCustom: {
    map: function (doc) {
      if (doc.$type === 'entry') {
        emit(doc._id);
      }
    },
    designDoc: 'custom',
  },
};
