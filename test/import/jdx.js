'use strict';

const imp = require('../../lib/import/import');
const path = require('path');

describe('import', function () {
    it('import jdx file', function () {
        var file = path.resolve(__dirname, '../homedir/test-import-db/jdx/to_process/104-55-2_zg.jdx');
        return imp.import('test-import-db', 'jdx', file);
    });
});
