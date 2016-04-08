'use strict';

module.exports = {
    getID: function () {
        return 'xyz';
    },
    getOwner: function () {
        return 'abc@xyz.com';
    },
    parse: function () {
        return {
            jpath: 'nmr',
            data: {
                abc: 'test'
            },
            field: 'jcamp',
            content_type: 'chemical/x-jcamp-dx'
        };
    },
    kind: function () {
        return 'molecule';
    }
};
