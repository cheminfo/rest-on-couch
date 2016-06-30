'use strict';

const Couch = require('..');

process.on('unhandledRejection', function(err) {
    throw err;
});

describe('basic initialization tests', function () {
    let couch;
    beforeEach(function () {
        couch = new Couch({database: 'test2'});
    });
    it('should init', function () {
        return couch.open();
    });

    it('should throw if no database given', function () {
        return Promise.resolve().then(() => {
            new Couch();
        }).should.be.rejectedWith('database option is mandatory');
    });
});
