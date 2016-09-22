'use strict';

module.exports = {
    customDesign: {
        version: 8,
        views: {
            lib: {
                test: 'lib.js'
            },
            test: {
                map: function (doc) {
                    emit(doc._id);
                }
            },
            testCustom: {
                map: function (doc) {
                    emit(doc._id);
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
    }
};
