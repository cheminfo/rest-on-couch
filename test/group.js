'use strict';

const data = require('./data/data');

describe('group methods', function () {
    before(data);
    it('anyone should be able to create a group', function() {
        return couch.createGroup('groupX', 'a@a.com').should.be.fulfilled();
    });
    it('cannot create if the group exists', function () {
        return couch.createGroup('groupA', 'a@a.com').should.be.rejectedWith(/already exists/);
    });
});
