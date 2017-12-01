'use strict';

const data = require('./data/noRights');

describe('token methods', function () {

    beforeEach(data);

    it('user should be able to create and get tokens', async () => {
        const tokens = await Promise.all([couch.createEntryToken('b@b.com', 'A'), couch.createEntryToken('b@b.com', 'B')]);
        tokens[0].$id.should.not.equal(tokens[1].$id);
        const token = tokens[0];
        token.$type.should.equal('token');
        token.$kind.should.equal('entry');
        token.$id.length.should.equal(32);
        token.$owner.should.equal('b@b.com');
        token.uuid.should.equal('A');
        token.rights.should.eql(['read']);

        const gotToken = await couch.getToken(token.$id);
        gotToken.$id.should.equal(token.$id);

        const allTokens = await couch.getTokens('b@b.com');
        allTokens.length.should.equal(2);
    });

    it('user should be able to create and destroy tokens', async () => {
        const token = await couch.createEntryToken('b@b.com', 'A');
        const gotToken = await couch.getToken(token.$id);
        gotToken.$id.should.equal(token.$id);
        await couch.deleteToken('b@b.com', token.$id);
        return couch.getToken(token.$id).should.be.rejected();
    });

    it('user should not be able to create a token without write right', async () => {
        return couch.createEntryToken('b@b.com', 'C').should.be.rejected();
    });

    it('user should be able to create a user token', async () => {
        const token = await couch.createUserToken('b@b.com');
        token.$id.should.be.a.String();
        token.$creationDate.should.be.a.Number();
        delete token.$id;
        delete token.$creationDate;
        token.should.eql({
            $type: 'token',
            $kind: 'user',
            $owner: 'b@b.com',
            rights: ['read']
        });
    });

    it('token should give read access to non public data', async () => {
        const token = await couch.createUserToken('b@b.com');
        await couch.getEntryById('A', 'a@a.com').should.be.rejectedWith('document not found');
        const entry = await couch.getEntry('A', 'a@a.com', {token});
        entry.should.be.an.Object();
    });

    it('token should give only the right for which it was created', async () => {
        const token = await couch.createUserToken('b@b.com', 'delete');
        await couch.getEntryById('A', 'a@a.com', {token}).should.be.rejectedWith('document not found');
        await couch.deleteEntry('A', 'a@a.com', {token});
    });

    it('anonymous user should not be able to create a token', async () => {
        await couch.createEntryToken('anonymous', 'A').should.be.rejectedWith('only a user can create a token');
        await couch.createUserToken('anonymous').should.be.rejectedWith('only a user can create a token');
    });

    it('token should not accept invalid right', async () => {
        await couch.createUserToken('a@a.com', 'test1').should.be.rejectedWith('invalid right: test1');
        await couch.createUserToken('a@a.com', ['read', 'test2']).should.be.rejectedWith('invalid right: test2');
    });
});
