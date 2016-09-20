'use strict';

const Couch = require('..');
const nanoPromise = require('../src/util/nanoPromise');
const assert = require('assert');

process.on('unhandledRejection', function (err) {
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

describe('basic initialization with custom design docs', function () {
    let couch;
    it('should load the design doc files at initialization', function () {
        couch = new Couch({database: 'test3'});
        return couch._initPromise.then(function () {
            var app = nanoPromise.getDocument(couch._db, '_design/app')
                .then(app => {
                    assert.notEqual(app, null);
                    assert.ok(app.views.test);
                    assert.ok(app.filters.abc);
                });
            var custom = nanoPromise.getDocument(couch._db, '_design/custom')
                .then(custom => {
                    assert.notEqual(custom, null);
                    assert.ok(custom.views.testCustom);
                });

            return Promise.all([app, custom]);
        });
    });

    it('should query a custom design document', function () {
        return couch.queryEntriesByUser('a@a.com', 'testCustom').then(data => {
            data.should.have.length(0);
        });
    });
});
