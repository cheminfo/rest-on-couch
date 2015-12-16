'use strict';

const Couch = require('..');
const data = require('./data/data');

describe('basic initialization tests', function () {
    let couch;
    beforeEach(function () {
        couch = new Couch({database: 'test'});
    });
    it('should init', function () {
        return couch._init();
    });
    //it.only('getDocumentById', function () {
    //    return couch.getDocumentById(123, 'luc@patiny.com').then(function (doc) {
    //        doc.shoul
    //    });
    //});
});

describe('basic tests on existing database', function () {
    let couch;
    beforeEach(function () {
        console.log('reset database')
        couch = new Couch({database: 'test'});
        return couch._init()
            .then(() => data.destroy(couch._nano, couch._databaseName))
            .then(() => {
                couch = new Couch({database: 'test'});
                return couch._init();
            })
            .then(() => data.populate(couch._db));
    });

    it.only('should ...', function() {
        return couch.getDocumentById('A', 'a@a.com').then(doc => {
            console.log(doc);
        });
    });
});
