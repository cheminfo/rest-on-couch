'use strict';

const data = require('../data/data');
const noRights = require('../data/noRights');

describe('group methods', () => {
  beforeEach(data);
  test('anyone should be able to create a group', () => {
    return expect(
      couch.createGroup('groupX', 'a@a.com')
    ).resolves.toBeDefined();
  });

  test('cannot create if the group exists', () => {
    return expect(couch.createGroup('groupA', 'a@a.com')).rejects.toThrow(
      /already exists/
    );
  });

  test('cannot delete group if user is not the owner of the group', () => {
    return expect(couch.deleteGroup('groupA', 'b@b.com')).rejects.toThrow();
  });

  test('should delete a group', () => {
    return expect(
      couch.deleteGroup('groupA', 'a@a.com')
    ).resolves.toBeDefined();
  });

  test('should throw if deleting non-existant group', () => {
    return expect(couch.deleteGroup('inexistant', 'a@a.com')).rejects.toThrow(
      /group does not exist/
    );
  });

  test('should add one user to group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', 'test123@example.com')
      .then(function () {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then(function (group) {
        expect(group.users).toHaveLength(2);
        expect(group.users[1]).toBe('test123@example.com');
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
        expect(group.users).toHaveLength(3);
        expect(group.users[1]).toBe('test123@example.com');
        expect(group.users[2]).toBe('dup@example.com');
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
        expect(group.users).toHaveLength(1);
        expect(group.users[0]).toBe('test123@example.com');
      });
  });

  test('getGroups should return users groups when owner without global readGroup right', () => {
    return couch.getGroups('a@a.com').then(function (docs) {
      expect(docs).toHaveLength(2);
      expect(docs[0].users[0]).toBe('a@a.com');
    });
  });

  test('getGroups should return groups when owner not owner but has global readGroup right', () => {
    return couch.getGroups('b@b.com').then(function (docs) {
      expect(docs).toHaveLength(2);
      expect(docs[0].users[0]).toBe('a@a.com');
    });
  });

  test('getGroups should not return groups when not owner and without the global readGroup right', () => {
    return couch.getGroups('c@c.com').then(function (docs) {
      expect(docs).toHaveLength(0);
    });
  });

  test('should get list of groups user is member of', async function () {
    const users = await couch.getUserGroups('a@a.com');
    expect(users.map((g) => g.name).sort()).toEqual(['groupA', 'groupB']);
  });
});

describe('group methods (no default rights)', () => {
  beforeEach(noRights);

  test('anyone cannot create group', () => {
    return expect(couch.createGroup('groupX', 'a@a.com')).rejects.toThrow(
      /does not have createGroup right/
    );
  });

  test('should get list of groups user is member of, including default groups', async function () {
    let groups = await couch.getUserGroups('a@a.com');
    groups.sort((a, b) => a.name.localeCompare(b.name));
    expect(groups).toEqual([
      { name: 'defaultAnonymousRead', rights: ['read'] },
      { name: 'defaultAnyuserRead', rights: ['read'] },
      { name: 'groupA', rights: ['create', 'write', 'delete', 'read'] },
      { name: 'inexistantGroup', rights: [] }
    ]);
  });
});
