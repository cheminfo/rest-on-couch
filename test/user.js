'use strict';

const data = require('./data/data');
const should = require('should');

describe('Couch user API', function () {
    before(data);
    it('Should get a user', function () {
        return couch.getUser('a@a.com').then(doc => {
            doc.user.should.equal('a@a.com');
        });
    });

    it('Get user should return null if not exists', function () {
        return couch.getUser('b@b.com').then(doc => {
            should(doc).be.exactly(null);
        });
    });

    it('Should save new  user', function () {
        return couch.editUser('b@b.com', {val: 'b', v: 'b'})
            .then(res => {
                res.rev.should.startWith('1');
            }).then(() => {
                return couch.getUser('b@b.com').then(doc => {
                    doc.user.should.equal('b@b.com');
                    doc.val.should.equal('b');
                });
            });
    });

    it('Should edit existing user', function () {
        return couch.editUser('b@b.com', {val: 'x'})
            .then(res => {
                res.rev.should.startWith('2');
            }).then(() => {
                return couch.getUser('b@b.com').then(doc => {
                    doc.user.should.equal('b@b.com');
                    doc.val.should.equal('x');
                    doc.v.should.equal('b');
                });
            });
    });
});
