'use strict';

const data = require('../data/data');

describe('Couch user API', () => {
  beforeEach(data);
  test('Should get a user', async () => {
    const doc = await couch.getUser('a@a.com');
    expect(doc.user).toBe('a@a.com');
  });

  test('Get user should throw if not exists', () => {
    return expect(couch.getUser('b@b.com')).rejects.toThrow(/not found/);
  });

  test('Edit user should throw when anonymous', () => {
    return expect(couch.editUser('anonymous', { val: 'test' })).rejects.toThrow(
      /must be an email/,
    );
  });

  test('Should edit user', async () => {
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

  test('getUserInfo', async () => {
    const user = await couch.getUserInfo('user@test.com');
    expect(user.email).toBe('user@test.com');
    expect(user.value).toBe(42);
  });
});
