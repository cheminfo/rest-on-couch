'use strict';

module.exports = {
    couchUrl: 'http://visualizer.epfl.ch/',
    couchDatabase: 'test-import',
    couchUser: null,
    couchPassword: null,
    getID: function (filename, contents) {
        return 'xyz';
    },
    getOwner: function (filename, contents) {
        return 'abc@xyz.com';
    },
    defaultEntry: function () {
        return {
            parent: [],
            name: [],
            molecule: [],
            nmr: []
        };
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
