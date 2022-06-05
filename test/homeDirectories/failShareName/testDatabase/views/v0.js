'use strict';

module.exports = {
  test: {
    map: function (doc) {
      emit(doc._id);
    },
    designDoc: 'viewTest',
  },
};
