'use strict';

const imp = require('../../src/import/import');
const dbconfig = require('../../src/util/dbconfig');
const path = require('path');

describe('import', function () {
    it('import jdx file', function () {
        var config = dbconfig.import('test-import-db/jdx/config.js');
        var file = path.resolve(__dirname, '../homedir/test-import-db/jdx/104-55-2_zg.jdx');
        return imp.import(config, file);
    });
});