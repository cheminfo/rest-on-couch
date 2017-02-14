'use strict';

module.exports = {
    defaultEntry: {
        test: function () {
            return {
                defaultField: 'default'
            };
        }
    },
    customDesign: {
        version: 1,
        views: {},
        updates: {}
    },
    rights: {
        read: ['anonymous'],
        createGroup: ['anonymous'],
        create: ['anonymous']
    }
};
