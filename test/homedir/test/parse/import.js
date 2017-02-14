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
            jpath: 'txt',
            data: {
                abc: 'test'
            },
            field: 'txt',
            content_type: 'text/plain'
        };
    },
    kind: function () {
        return 'test';
    }
};
