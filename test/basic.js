'use strict';

const Couch = require('..');
const data = require('./data/data');
const testConfig = require('../test-old/config');

process.on('unhandledRejection', function(err) {
    throw err;
});

describe('basic initialization tests', function () {
    let couch;
    beforeEach(function () {
        var db = testConfig.database;
        testConfig.database = 'test2';
        couch = new Couch(testConfig);
        testConfig.database = db;
    });
    it('should init', function () {
        return couch._init();
    });

    it('should throw if no database given', function () {
        return Promise.resolve().then(() => {
            new Couch()
        }).should.be.rejectedWith('database option is mandatory')
    });
});
