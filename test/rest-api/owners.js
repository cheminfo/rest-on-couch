'use strict';

const request = require('../setup').getAgent();
const data = require('../data/data');
const authenticateAs = require('./authenticate');

describe('rest api - manage owners', function () {
    const id = 'A';
    before(function () {
        return data().then(() => authenticateAs(request, 'b@b.com', '123'));
    });
    it('get owners', function () {
        return request.get(`/db/test/entry/${id}/_owner`)
            .expect(200).then(result => {
                result.body.should.be.an.Array().with.lengthOf(3);
                result.body[0].should.equal('b@b.com');
            });
    });
    it('add owner', function () {
        return request.put(`/db/test/entry/${id}/_owner/test`)
            .expect(200)
            .then(() => couch.getEntry(id, 'b@b.com'))
            .then(entry => {
                entry.$owners.should.containEql('test');
            });
    });
    it('remove owner', function () {
        return couch.addOwnersToDoc(id, 'b@b.com', 'testRemove', 'entry')
            .then(() => {
                return request.del(`/db/test/entry/${id}/_owner/testRemove`)
                    .expect(200)
                    .then(() => couch.getEntry(id, 'b@b.com'))
                    .then(entry => {
                        entry.$owners.should.not.containEql('testRemove');
                    });
            });
    });
});
