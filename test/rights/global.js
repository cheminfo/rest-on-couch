'use strict';
const anyuserData = require('../data/anyuser');

describe('global anyuser right', function () {
    before(anyuserData);

    it('Should grant read access to any logged user', function () {
        return couch.getEntryById('A', 'a@a.com').then(doc => {
            doc.should.be.an.instanceOf(Object);
        });
    });

    it('Should not grant read access to anonymous', function () {
        return couch.getEntryById('A', 'anonymous').should.be.rejectedWith(/no access/);
    });
});
