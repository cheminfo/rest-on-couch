'use strict';

module.exports = {
    getID: function () {
        return 'ignored';
    },
    getOwner: function () {
        return 'test-import@test.com';
    },
    parse: function () {
        return {
            42: '42'
        }
    },
    shouldIgnore: function() {
        return true;
    }
};
