'use strict';

const data = require('./data/data');
const noRights = require('./data/noRights');

describe('group methods', function () {
    beforeEach(data);
    it('anyone should be able to create a group', function () {
        return couch.createGroup('groupX', 'a@a.com').should.be.fulfilled();
    });

    it('cannot create if the group exists', function () {
        return couch.createGroup('groupA', 'a@a.com').should.be.rejectedWith(/already exists/);
    });

    it('cannot delete group if user is not the owner of the group', function () {
        return couch.deleteGroup('groupA', 'b@b.com').should.be.rejected();
    });

    it('should delete a group', function () {
        return couch.deleteGroup('groupA', 'a@a.com').should.be.fulfilled();
    });

    it('should throw if deleting non-existant group', function () {
        return couch.deleteGroup('inexistant', 'a@a.com').should.be.rejectedWith(/group does not exist/);
    });

    it('should add one user to group', function () {
        return couch.addUsersToGroup('groupA', 'a@a.com', 'test123@example.com').then(function () {
            return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
        }).then(function (group) {
            group.users.should.have.lengthOf(2);
            group.users[1].should.equal('test123@example.com');
        });
    });

    it('should add several users to group', function () {
        return couch.addUsersToGroup('groupA', 'a@a.com', ['test123@example.com', 'dup@example.com', 'dup@example.com'])
            .then(function () {
                return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
            }).then(function (group) {
                group.users.should.have.lengthOf(3);
                group.users[1].should.equal('test123@example.com');
                group.users[2].should.equal('dup@example.com');
            });
    });

    it('should remove users from group', function () {
        return couch.addUsersToGroup('groupA', 'a@a.com', ['test123@example.com'])
            .then(function () {
                return couch.removeUsersFromGroup('groupA', 'a@a.com', 'a@a.com');
            }).then(function () {
                return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
            }).then(function (group) {
                group.users.should.have.lengthOf(1);
                group.users[0].should.equal('test123@example.com');
            });
    });

    it('getGroups should return users groups', function () {
        return couch.getDocsAsOwner('a@a.com', 'group', {onlyDoc: true})
            .then(function (docs) {
                docs.should.have.lengthOf(2);
                docs[0].users[0].should.equal('a@a.com');
            });
    });
});

describe('group methods (no default rights)', function () {
    beforeEach(noRights);

    it('anyone cannot create group', function () {
        return couch.createGroup('groupX', 'a@a.com').should.be.rejectedWith(/does not have createGroup right/);
    });
});
