'use strict';
const anyuserData = require('../data/anyuser');
const noRights = require('../data/noRights');

describe('Access based on global rights', function () {
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

describe('Edit global rights', function ()  {
    before(noRights);

    it('Should only accept valid types', function () {
        return couch.addGlobalRight('unvalid', 'a@a.com').should.be.rejectedWith(/Invalid global right type/);
    });

    it('Should not grant read before editing global right', function () {
        return couch.getEntryById('B', 'a@a.com').should.be.rejectedWith(/no access/);
    });

    it('Should add global read right and grant access', function () {
        return couch.addGlobalRight('read', 'a@a.com')
            .then(() => couch.getEntryById('B', 'a@a.com'))
            .should.eventually.be.an.instanceOf(Object);
    });

    it('Sould remove global read right and not grant access anymore', function () {
        return couch.removeGlobalRight('read', 'a@a.com')
            .then(() => couch.getEntryById('B', 'a@a.com'))
            .should.be.rejectedWith(/no access/);
    });

});
