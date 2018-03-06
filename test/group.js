'use strict';

const data = require('./data/data');
const noRights = require('./data/noRights');

describe('group methods', () => {
  beforeEach(data);
  test('anyone should be able to create a group', () => {
    return couch.createGroup('groupX', 'a@a.com').should.be.fulfilled();
  });

  test('cannot create if the group exists', () => {
    return couch
      .createGroup('groupA', 'a@a.com')
      .should.be.rejectedWith(/already exists/);
  });

  test('cannot delete group if user is not the owner of the group', () => {
    return couch.deleteGroup('groupA', 'b@b.com').should.be.rejected();
  });

  test('should delete a group', () => {
    return couch.deleteGroup('groupA', 'a@a.com').should.be.fulfilled();
  });

  test('should throw if deleting non-existant group', () => {
    return couch
      .deleteGroup('inexistant', 'a@a.com')
      .should.be.rejectedWith(/group does not exist/);
  });

  test('should add one user to group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', 'test123@example.com')
      .then(function () {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then(function (group) {
        group.users.should.have.lengthOf(2);
        group.users[1].should.equal('test123@example.com');
      });
  });

  test('should add several users to group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', [
        'test123@example.com',
        'dup@example.com',
        'dup@example.com'
      ])
      .then(function () {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then(function (group) {
        group.users.should.have.lengthOf(3);
        group.users[1].should.equal('test123@example.com');
        group.users[2].should.equal('dup@example.com');
      });
  });

  test('should remove users from group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', ['test123@example.com'])
      .then(function () {
        return couch.removeUsersFromGroup('groupA', 'a@a.com', 'a@a.com');
      })
      .then(function () {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then(function (group) {
        group.users.should.have.lengthOf(1);
        group.users[0].should.equal('test123@example.com');
      });
  });

  test(
    'getGroups should return users groups when owner without global readGroup right',
    () => {
      return couch.getGroups('a@a.com').then(function (docs) {
        docs.should.have.lengthOf(2);
        docs[0].users[0].should.equal('a@a.com');
      });
    }
  );

  test(
    'getGroups should return groups when owner not owner but has global readGroup right',
    () => {
      return couch.getGroups('b@b.com').then(function (docs) {
        docs.should.have.lengthOf(2);
        docs[0].users[0].should.equal('a@a.com');
      });
    }
  );

  test(
    'getGroups should not return groups when not owner and without the global readGroup right',
    () => {
      return couch.getGroups('c@c.com').then(function (docs) {
        docs.should.have.lengthOf(0);
      });
    }
  );
});

describe('group methods (no default rights)', () => {
  beforeEach(noRights);

  test('anyone cannot create group', () => {
    return couch
      .createGroup('groupX', 'a@a.com')
      .should.be.rejectedWith(/does not have createGroup right/);
  });
});
