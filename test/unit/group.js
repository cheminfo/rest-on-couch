import { beforeEach, describe, expect, test } from 'vitest';

import data from '../data/data.js';
import noRights from '../data/noRights.js';

describe('group methods', () => {
  beforeEach(data);
  test('anyone should be able to create a group', () => {
    return expect(
      couch.createGroup('groupX', 'a@a.com'),
    ).resolves.toBeDefined();
  });

  test('cannot create if the group exists', () => {
    return expect(couch.createGroup('groupA', 'a@a.com')).rejects.toThrow(
      /already exists/,
    );
  });

  test('cannot delete group if user is not the owner of the group', () => {
    return expect(couch.deleteGroup('groupA', 'b@b.com')).rejects.toThrow();
  });

  test('should delete a group', () => {
    return expect(
      couch.deleteGroup('groupA', 'a@a.com'),
    ).resolves.toBeDefined();
  });

  test('should throw if deleting non-existant group', () => {
    return expect(couch.deleteGroup('inexistant', 'a@a.com')).rejects.toThrow(
      /group does not exist/,
    );
  });

  test('should add one user to group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', 'test123@example.com')
      .then(() => {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then((group) => {
        expect(group.users).toHaveLength(2);
        expect(group.customUsers).toHaveLength(2);
        expect(group.users[1]).toBe('test123@example.com');
        expect(group.customUsers[1]).toBe('test123@example.com');
      });
  });

  test('should add several users to group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', [
        'test123@example.com',
        'dup@example.com',
        'dup@example.com',
      ])
      .then(() => {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then((group) => {
        expect(group.users).toHaveLength(3);
        expect(group.users[1]).toBe('test123@example.com');
        expect(group.users[2]).toBe('dup@example.com');
        expect(group.customUsers[1]).toBe('test123@example.com');
        expect(group.customUsers[2]).toBe('dup@example.com');
      });
  });

  test('should add user which already exists', async () => {
    const group = await couch.getGroup('groupA', 'a@a.com');

    const updateData = await couch.addUsersToGroup('groupA', 'a@a.com', [
      'a@a.com',
    ]);
    expect(updateData).toBeDefined();
    expect(updateData.id).toEqual(group._id);
    expect(updateData.rev).toEqual(group._rev);
    expect(updateData.$modificationDate).toEqual(group.$modificationDate);
    expect(updateData.$creationDate).toEqual(group.$creationDate);
    expect(updateData.isNew).toBe(false);
  });

  test('should remove user which does not exist', async () => {
    const group = await couch.getGroup('groupA', 'a@a.com');

    const updateData = await couch.removeUsersFromGroup('groupA', 'a@a.com', [
      'b@b.com',
    ]);
    expect(updateData).toBeDefined();
    expect(updateData.id).toEqual(group._id);
    expect(updateData.rev).toEqual(group._rev);
    expect(updateData.$modificationDate).toEqual(group.$modificationDate);
    expect(updateData.$creationDate).toEqual(group.$creationDate);
    expect(updateData.isNew).toBe(false);
  });

  test('should remove users from group', () => {
    return couch
      .addUsersToGroup('groupA', 'a@a.com', ['test123@example.com'])
      .then(() => {
        return couch.removeUsersFromGroup('groupA', 'a@a.com', 'a@a.com');
      })
      .then(() => {
        return couch.getDocByRights('groupA', 'a@a.com', 'read', 'group');
      })
      .then((group) => {
        expect(group.users).toHaveLength(1);
        expect(group.users[0]).toBe('test123@example.com');
        expect(group.customUsers).toHaveLength(1);
        expect(group.customUsers[0]).toBe('test123@example.com');
      });
  });

  test('getGroups should return users groups when owner without global readGroup right', () => {
    return couch.getGroups('a@a.com').then((docs) => {
      expect(docs).toHaveLength(3);
      expect(docs[0].users[0]).toBe('a@a.com');
      expect(docs[0].customUsers[0]).toBe('a@a.com');
    });
  });

  test('getGroupsInfo should return all data when group owner', () => {
    return couch.getGroupsInfo('a@a.com').then((groups) => {
      expect(groups).toHaveLength(3);
      // a@a.com sees users and rights because it is the owner of all groups
      expect(groups).toStrictEqual([
        {
          name: 'groupA',
          description: 'groupA description',
          users: ['a@a.com'],
          rights: ['create', 'write', 'delete', 'read'],
        },
        {
          name: 'groupB',
          description: undefined,
          users: ['a@a.com'],
          rights: ['create'],
        },
        {
          name: 'groupC',
          description: 'groupC is not used in entries',
          users: ['c@c.com'],
          rights: ['create', 'write', 'delete', 'read'],
        },
      ]);
    });
  });

  test('getGroupsInfo should return all data when user has readGroup right', () => {
    return couch.getGroupsInfo('b@b.com').then((groups) => {
      expect(groups).toHaveLength(3);
      // Sees everything because has global readGroup right
      expect(groups).toStrictEqual([
        {
          name: 'groupA',
          description: 'groupA description',
          users: ['a@a.com'],
          rights: ['create', 'write', 'delete', 'read'],
        },
        {
          name: 'groupB',
          description: undefined,
          users: ['a@a.com'],
          rights: ['create'],
        },
        {
          name: 'groupC',
          description: 'groupC is not used in entries',
          users: ['c@c.com'],
          rights: ['create', 'write', 'delete', 'read'],
        },
      ]);
    });
  });

  test('getGroupsInfo should return limited data except if member', () => {
    return couch.getGroupsInfo('c@c.com').then((groups) => {
      expect(groups).toHaveLength(3);
      // Sees everything because has global readGroup right
      expect(groups).toStrictEqual([
        {
          name: 'groupA',
          description: 'groupA description',
        },
        {
          name: 'groupB',
          description: undefined,
        },
        // Sees everything because is a member
        {
          name: 'groupC',
          description: 'groupC is not used in entries',
          users: ['c@c.com'],
          rights: ['create', 'write', 'delete', 'read'],
        },
      ]);
    });
  });

  test('getGroupsInfo should throw if user is anonymous', () => {
    return expect(couch.getGroupsInfo('anonymous')).rejects.toThrow(
      /user must be authenticated to get groups info/,
    );
  });

  test('getGroups should return groups when owner not owner but has global readGroup right', () => {
    return couch.getGroups('b@b.com').then((docs) => {
      expect(docs).toHaveLength(3);
      expect(docs[0].users[0]).toBe('a@a.com');
    });
  });

  test('getGroups should not return groups when not owner and without the global readGroup right', () => {
    return couch.getGroups('c@c.com').then((docs) => {
      expect(docs).toHaveLength(0);
    });
  });

  test('should get list of groups user is member of', async () => {
    const users = await couch.getUserGroups('a@a.com');
    expect(users.map((g) => g.name).sort()).toEqual(['groupA', 'groupB']);
  });
});

describe('ldap group methods', () => {
  beforeEach(data);
  const ldapGroupProperties = {
    filter:
      '(&(objectClass=inetOrgPerson)(memberOf=cn=Maintainers,ou=Groups,dc=zakodium,dc=com))',
    DN: 'dc=zakodium,dc=com',
  };
  test('create an LDAP group', async () => {
    const newGroup = await couch.createGroup('groupLdap', 'a@a.com', []);
    expect(newGroup).toBeDefined();
    expect(newGroup.isNew).toBe(true);
    const group = await couch.getGroup('groupLdap', 'a@a.com');
    expect(group).toBeDefined();
    expect(group.filter).not.toBeDefined();
    expect(group.DN).not.toBeDefined();
    expect(group._id).toBe(newGroup.id);
    expect(group.users).toStrictEqual([]);
  });

  test('set ldap group properties and sync group', async () => {
    const newGroup = await couch.createGroup('groupLdap', 'a@a.com', []);
    await couch.setGroupProperties(newGroup.id, 'a@a.com', ldapGroupProperties);

    let updatedGroup = await couch.getGroup('groupLdap', 'a@a.com');
    expect(updatedGroup.users).toHaveLength(2);
    expect(updatedGroup.customUsers).toHaveLength(0);

    await couch.addUsersToGroup(newGroup.id, 'a@a.com', ['b@b.com']);
    updatedGroup = await couch.getGroup('groupLdap', 'a@a.com');
    expect(updatedGroup.users).toHaveLength(3);
    expect(updatedGroup.customUsers).toHaveLength(1);

    // resync
    await couch.syncGroup(newGroup.id, 'a@a.com');
    updatedGroup = await couch.getGroup('groupLdap', 'a@a.com');
    expect(updatedGroup.users).toHaveLength(3);
    expect(updatedGroup.customUsers).toHaveLength(1);
  });

  test('getGroupsInfo and getGroupInfo with ldap group', async () => {
    const newGroup = await couch.createGroup('groupLdap', 'a@a.com', []);
    await couch.setGroupProperties(newGroup.id, 'a@a.com', ldapGroupProperties);

    let groups = await couch.getGroupsInfo('a@a.com');
    let info = groups.find((g) => g.name === 'groupLdap');
    expect(info).toStrictEqual({
      name: 'groupLdap',
      description: undefined,
      users: ['developer@zakodium.com', 'maintainer@zakodium.com'],
      rights: [],
    });

    groups = await couch.getGroupsInfo('a@a.com', { ldapInfo: true });
    info = groups.find((g) => g.name === 'groupLdap');

    const expectedResult = {
      name: 'groupLdap',
      description: undefined,
      users: ['developer@zakodium.com', 'maintainer@zakodium.com'],
      rights: [],
      ldapInfo: [
        { displayName: 'Developer User', email: 'developer@zakodium.com' },
        { displayName: 'Maintainer User', email: 'maintainer@zakodium.com' },
      ],
    };
    expect(info).toStrictEqual(expectedResult);

    info = await couch.getGroupInfo('groupLdap', 'a@a.com', { ldapInfo: true });
    expect(info).toStrictEqual(expectedResult);
  });

  test('getGroupInfo with inexistant group', () => {
    return expect(() =>
      couch.getGroupInfo('notexisting', 'a@a.com'),
    ).rejects.toThrow(/group does not exist/);
  });
});

describe('group methods (no default rights)', () => {
  beforeEach(noRights);

  test('anyone cannot create group', () => {
    return expect(couch.createGroup('groupX', 'a@a.com')).rejects.toThrow(
      /does not have createGroup right/,
    );
  });

  test('should get list of groups user is member of, including default groups', async () => {
    let groups = await couch.getUserGroups('a@a.com');
    groups.sort((a, b) => a.name.localeCompare(b.name));
    expect(groups).toEqual([
      { name: 'defaultAnonymousRead', rights: ['read'] },
      { name: 'defaultAnyuserRead', rights: ['read'] },
      { name: 'groupA', rights: ['create', 'write', 'delete', 'read'] },
      { name: 'inexistantGroup', rights: [] },
    ]);
  });
});
