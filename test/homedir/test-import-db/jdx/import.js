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
            type: 'jcamp',
            content_type: 'chemical/x-jcamp-dx'
        };
    },
    kind: function (filename, contents) {
        return 'molecule';
    }
};
