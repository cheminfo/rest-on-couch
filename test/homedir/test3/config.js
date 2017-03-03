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
                    if (doc.$type === 'entry') {
                        emit(doc._id);
                    }
                }
            },
            testCustom: {
                map: function (doc) {
                    if (doc.$type === 'entry') {
                        emit(doc._id);
                    }
                },
                designDoc: 'custom'
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
