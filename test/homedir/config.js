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
                    emitWithOwner(null, doc.$id);
                },
                withOwner: true
            }
        }
    }
};
