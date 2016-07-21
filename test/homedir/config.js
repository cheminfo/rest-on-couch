'use strict';

/* eslint-disable no-undef */

module.exports = {
    username: 'admin',
    password: 'admin',
    autoCreateDatabase: true,
    customDesign: {
        views: {
            entryIdByRight: {
                map: function (doc) {
                    emitWithOwner(['x', 'y', 'z'], doc.$id);
                },
                withOwner: true
            }
        }
    },
    auth: {
        couchdb: {}
    }
};
