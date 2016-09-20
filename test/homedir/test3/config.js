'use strict';

module.exports = {
    customDesign: {
        version: 6,
        views: {
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
