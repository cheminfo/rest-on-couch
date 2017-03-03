'use strict';

const imp = require('../../src/import/import');
const path = require('path');
const Couch = require('../..');
const nanoPromise = require('../../src/util/nanoPromise');

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile = path.resolve(__dirname, '../homedir/test-import/parse/to_process/test.txt');
const jsonFile = path.resolve(__dirname, '../homedir/test-import/json/to_process/test.json');

describe('import', function () {
    before(initCouch);
    it('parse', function () {
        return imp.import('test-import', 'parse', textFile).then(() => {
            return importCouch.getEntryById('parse', 'test-import@test.com').then(data => {
                data.should.be.an.Object();
                data.$content.should.be.an.Object();
                data.$content.txt.should.be.an.Array();
                const txt = data.$content.txt[0];
                txt.should.be.an.Object();
                txt.abc.should.be.equal('test');
                txt.filename.should.equal('test.txt');
                txt.txt.should.be.an.Object();
                txt.contents.should.be.equal('Content of test file');
            });
        });
    });

    it('ignore import', function () {
        return imp.import('test-import', 'ignore', textFile).then(() => {
            return importCouch.getEntryById('ignored', 'test-import@test.com').should.be.rejectedWith(/not found/);
        });
    });


    it('import json file', function () {
        return imp.import('test-import', 'json', jsonFile).then(() => {
            return importCouch.getEntryById('json', 'test-import@test.com').should.eventually.be.an.Object();
        });
    });
});

function initCouch() {
    importCouch = new Couch({database: 'test-import'});
    return importCouch.open()
        .then(() => destroy(importCouch._nano, importCouch._databaseName))
        .then(() => {
            importCouch = new Couch({
                database: 'test-import',
            });
            return importCouch.open();
        });
}

function destroy(nano, name) {
    return nanoPromise.destroyDatabase(nano, name);
}
