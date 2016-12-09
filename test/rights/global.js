'use strict';
const anyuserData = require('../data/anyuser');
const noRights = require('../data/noRights');

describe('Access based on global rights', function () {
    before(anyuserData);

    it('Should grant read access to any logged user', function () {
        return couch.getEntry('A', 'a@a.com').then(doc => {
            doc.should.be.an.instanceOf(Object);
        });
    });

    it('Should not grant read access to anonymous', function () {
        return couch.getEntry('A', 'anonymous').should.be.rejectedWith(/no access/);
    });
});

describe('Edit global rights', function () {
    before(noRights);

    it('Should refuse non-admins', function () {
        return couch.addGlobalRight('a@a.com', 'read', 'a@a.com').should.be.rejectedWith(/Only administrators/);
    });

    it('Should only accept valid types', function () {
        return couch.addGlobalRight('admin@a.com', 'invalid', 'a@a.com').should.be.rejectedWith(/Invalid global right type/);
    });

    it('Should not grant read before editing global right', function () {
        return couch.getEntry('B', 'a@a.com').should.be.rejectedWith(/no access/);
    });

    it('Should add global read right and grant access', function () {
        return couch.addGlobalRight('admin@a.com', 'read', 'a@a.com')
            .then(() => couch.getEntry('B', 'a@a.com'))
            .should.eventually.be.an.instanceOf(Object);
    });

    it('Should remove global read right and not grant access anymore', function () {
        return couch.removeGlobalRight('admin@a.com', 'read', 'a@a.com')
            .then(() => couch.getEntry('B', 'a@a.com'))
            .should.be.rejectedWith(/no access/);
    });
});
