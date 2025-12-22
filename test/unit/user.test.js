import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import data from '../data/data.js';

describe('Couch user API', () => {
  beforeEach(data);
  it('Should get a user', async () => {
    const doc = await couch.getUser('a@a.com');
    expect(doc.user).toBe('a@a.com');
  });

  it('Get user should throw if not exists', () => {
    return expect(couch.getUser('b@b.com')).rejects.toThrow(/not found/);
  });

  it('Edit user should throw when anonymous', () => {
    return expect(couch.editUser('anonymous', { val: 'test' })).rejects.toThrow(
      /must be an email/,
    );
  });

  it('Should edit user', async () => {
    {
      const res = await couch.editUser('b@b.com', { val: 'b', v: 'b' });
      expect(res.rev).toMatch(/^1/);
    }
    {
      const doc = await couch.getUser('b@b.com');
      expect(doc.user).toBe('b@b.com');
      expect(doc.val).toBe('b');
    }
    {
      const res = await couch.editUser('b@b.com', { val: 'x' });
      expect(res.rev).toMatch(/^2/);
    }
    {
      const doc = await couch.getUser('b@b.com');
      expect(doc.user).toBe('b@b.com');
      expect(doc.val).toBe('x');
      expect(doc.v).toBe('b');
    }
  });

  it('getUserInfo', async () => {
    const user = await couch.getUserInfo('user@test.com', null);
    expect(user).toStrictEqual({
      email: 'user@test.com',
      value: 42,
      groups: [],
      sessionData: null,
    });
  });

  it('getUserInfo with user which belongs to groups', async () => {
    const user = await couch.getUserInfo('a@a.com', null);
    expect(user).toStrictEqual({
      email: 'a@a.com',
      value: 42,
      groups: [
        { name: 'groupA', rights: ['create', 'write', 'delete', 'read'] },
        { name: 'groupB', rights: ['create'] },
      ],
      sessionData: null,
    });
  });
});
