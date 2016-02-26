'use strict';

const data = require('../data/data');

describe('getGroupsByRight', function () {
    before(data);
    it('user with create right', function () {
        return global.couch.getGroupsByRight('a@a.com', 'create')
            .then(result => {
                result.sort().should.eql(['groupA', 'groupB']);
            });
    });
    it('user without write right', function () {
        return global.couch.getGroupsByRight('a@a.com', 'write')
            .should.eventually.eql(['groupA']);
    });
    it('user without dummy right', function () {
        return global.couch.getGroupsByRight('a@a.com', 'dummy')
            .should.eventually.eql([]);
    });
});
