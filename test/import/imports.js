'use strict';

const imp = require('../../lib/import/import');
const path = require('path');

// The file in most test cases does not matter
// We just have to pick an existing file
const file = path.resolve(__dirname, '../homedir/test/parse/to_process/test.txt');

describe('import', function () {
    it('import parse file', function () {
        return imp.import('test', 'parse', file).then(() => {
                return couch.getEntryById('xyz' ,'test-import@test.com').should.eventually.be.an.Object();
            });
    });
});
