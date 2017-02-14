'use strict';

module.exports = {
    getID: function () {
        return 'parse';
    },
    getOwner: function () {
        return 'test-import@test.com';
    },
    parse: function (filename, contents) {
        return {
            jpath: 'txt',
            data: {
                abc: 'test',
                contents: contents.toString(),
                filename: filename
            },
            field: 'txt',
            content_type: 'text/plain'
        };
    },
    kind: function () {
        return 'test';
    }
};
