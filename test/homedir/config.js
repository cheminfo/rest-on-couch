'use strict';

/* eslint-disable no-undef */

module.exports = {
    username: 'admin',
    password: 'admin',
    administrators: ['admin@a.com'],
    autoCreateDatabase: true,
    customDesign: {
        views: {
            entryIdByRight: {
                map: function (doc) {
                    emitWithOwner(['x', 'y', 'z'], doc.$id);
                },
                withOwner: true
            },
            testReduce: {
                map: function (doc) {
                    if(doc.$type === 'entry') {
                        emit(doc._id, 1); // eslint-disable-line no-undef
                    }
                },
                reduce: function(keys, values) {
                    return sum(values);
                }
            }
        }
    },
    auth: {
        couchdb: {}
    },
    getUserInfo(email) {
        return Promise.resolve({
            email,
            value: 42
        });
    }
};
