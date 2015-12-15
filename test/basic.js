'use strict';

const Couch = require('..');

describe('basic initialization tests', function () {
    it('should init', function () {
        const couch = new Couch({
            database: 'test'
        });
        return couch._init();
    });
});
