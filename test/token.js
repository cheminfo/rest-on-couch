'use strict';

const data = require('./data/data');

describe('token methods', function () {
    before(data);
    it('user should be able to create and get tokens', function () {
        return Promise.all([couch.createEntryToken('a@a.com', 'A'), couch.createEntryToken('a@a.com', 'B')])
            .then(tokens => {
                tokens[0].$id.should.not.equal(tokens[1].$id);
                const token = tokens[0];
                token.$type.should.equal('token');
                token.$kind.should.equal('entry');
                token.$id.length.should.equal(32);
                token.$owner.should.equal('a@a.com');
                token.uuid.should.equal('A');
                token.rights.should.eql(['read']);
                return couch.getToken(token.$id).then(gotToken => {
                    gotToken.$id.should.equal(token.$id);
                    return couch.getTokens().then(tokens => {
                        tokens.length.should.equal(2);
                    });
                });
            });
    });

    it('user should be able to create and destroy tokens', function () {
        return couch.createEntryToken('a@a.com', 'A')
            .then(token => {
                return couch.getToken(token.$id).then(gotToken => {
                    gotToken.$id.should.equal(token.$id);
                    return couch.deleteToken('a@a.com', token.$id).then(() => {
                        return couch.getToken(token.$id).should.be.rejected();
                    });
                });
            });
    });

    it('user should not be able to create a token without write right', function () {
        return couch.createEntryToken('a@a.com', 'C').should.be.rejected();
    });


});
