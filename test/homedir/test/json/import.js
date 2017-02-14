'use strict';

module.exports = {
    getID: function () {
        return 'xyz';
    },
    getOwner: function () {
        return 'abc@xyz.com';
    },
    json: function (filename, contents) {
        contents = contents.toString();
        return JSON.parse(contents);
    }
};
