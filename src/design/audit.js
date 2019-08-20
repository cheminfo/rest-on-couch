'use strict';

/* istanbul ignore file  */

const auditDesignDoc = {
  version: 2, // CHANGE THIS NUMBER IF YOU UPDATE THE DESIGN DOC
  _id: '_design/audit',
  views: {
    byDate: {
      map: function(doc) {
        emit(doc.date);
      },
    },
    byUsername: {
      map: function(doc) {
        emit([doc.username, doc.date]);
      },
    },
  },
};

module.exports = auditDesignDoc;
