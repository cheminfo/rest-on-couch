'use strict';

const imp = require('../../lib/import/import');
const path = require('path');
const Couch = require('../..');
const nanoPromise = require('../../lib/util/nanoPromise');

var importCouch;
// The file in most test cases does not matter
// We just have to pick an existing file
const textFile = path.resolve(__dirname, '../homedir/test-import/parse/to_process/test.txt');

describe('import', function () {
    before(initCouch);
    it('parse', function () {
        return imp.import('test-import', 'parse', textFile).then(() => {
                return importCouch.getEntryById('xyz' ,'test-import@test.com').should.eventually.be.an.Object();
            });
    });

    it('ignore import', function () {
        return imp.import('test-import', 'ignore', textFile).then(() => {
           return importCouch.getEntryById('ignored', 'test-import@test.com').should.eventually.be.rejectedWith(/not found/);
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