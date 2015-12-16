'use strict';

const Couch = require('..');

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
