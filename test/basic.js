'use strict';

const Couch = require('..');
const data = require('./data/data');
process.on('unhandledRejection', function(err) {
    throw err;
});

describe('basic initialization tests', function () {
    let couch;
    beforeEach(function () {
        couch = new Couch({database: 'test'});
    });
    it('should init', function () {
        return couch._init();
    });
});

