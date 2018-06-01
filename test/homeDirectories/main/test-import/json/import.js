'use strict';

module.exports = {
    getID: function () {
        return 'json';
    },
    getOwner: function () {
        return 'test-import@test.com';
    },
    json: function (filename, contents) {
        // contents is already parsed
        return contents;
    },
    kind: function () {
        return 'test';
    }
};
