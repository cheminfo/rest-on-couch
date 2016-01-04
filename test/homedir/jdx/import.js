'use strict';

module.exports = {
    getID: function (filename, contents) {
        return 'xyz';
    },
    getOwner: function (filename, contents) {
        return 'abc@xyz.com';
    },
    parse: function (filename, contents) {
        return {
            jpath: 'nmr',
            data: {
                abc: 'test'
            },
            type: 'jcamp',
            content_type: 'chemical/x-jcamp-dx'
        };
    }
};
