'use strict';

module.exports = {
    getID: function () {
        return 'xyz';
    },
    getOwner: function () {
        return 'test-import@test.com';
    },
    json: function (filename, contents) {
        contents = contents.toString();
        return JSON.parse(contents);
    }
};
