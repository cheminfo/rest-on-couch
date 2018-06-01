'use strict';

module.exports = {
  viewTest: {
    map: function (doc) {
      emit(doc._id);
    }
  }
};
