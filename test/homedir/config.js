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
                    if (doc.$type !== 'entry') return;
                    for (var i = 0; i < doc.$owners.length; i++) {
                        emit([doc.$owners[i]], doc.$id);
                    }
                },
                withOwner: true
            }
        }
    }
};
