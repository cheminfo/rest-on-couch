'use strict';

const data = require('../data/noRights');
const testUtils = require('../utils/testUtils');

describe('token methods', () => {
  beforeEach(data);

  test('user should be able to create and get tokens', async () => {
    const tokens = await Promise.all([
      couch.createEntryToken('b@b.com', 'A'),
      couch.createEntryToken('b@b.com', 'B'),
      couch.createEntryToken('b@b.com', 'B', ['read', 'write']),
    ]);
    expect(tokens[0].$id).not.toBe(tokens[1].$id);
    expect(tokens[0].$id).not.toBe(tokens[2].$id);
    const token = tokens[0];
    expect(token.$type).toBe('token');
    expect(token.$kind).toBe('entry');
    expect(token.$id.length).toBe(32);
    expect(token.$owner).toBe('b@b.com');
    expect(token.uuid).toBe('A');
    expect(token.rights).toEqual(['read']);

    const writeToken = tokens[2];
    expect(writeToken.$type).toBe('token');
    expect(writeToken.$kind).toBe('entry');
    expect(writeToken.$id.length).toBe(32);
    expect(writeToken.$owner).toBe('b@b.com');
    expect(writeToken.uuid).toBe('B');
    expect(writeToken.rights).toEqual(['read', 'write']);

    const gotToken = await couch.getToken(token.$id);
    expect(gotToken.$id).toBe(token.$id);

    const allTokens = await couch.getTokens('b@b.com');
    expect(allTokens.length).toBe(3);
  });

  test('user should be able to create and destroy tokens', async () => {
    const token = await couch.createEntryToken('b@b.com', 'A');
    const gotToken = await couch.getToken(token.$id);
    expect(gotToken.$id).toBe(token.$id);
    await couch.deleteToken('b@b.com', token.$id);
    return expect(couch.getToken(token.$id)).rejects.toBeDefined();
  });

  test('user should not be able to create a token without write right', () => {
    return expect(couch.createEntryToken('b@b.com', 'C')).rejects.toBeDefined();
  });

  test('user should be able to create a user token', async () => {
    const token = await couch.createUserToken('b@b.com');
    expect(token.$id).toMatch(testUtils.tokenReg);
    expect(token.$creationDate).toBeGreaterThan(0);
    delete token.$id;
    delete token.$creationDate;
    expect(token).toEqual({
      $type: 'token',
      $kind: 'user',
      $owner: 'b@b.com',
      rights: ['read'],
    });
  });

  test('user should be able to create a user token with rights', async () => {
    const token = await couch.createUserToken('b@b.com', [
      'read',
      'addAttachment',
    ]);
    expect(token.$id).toMatch(testUtils.tokenReg);
    expect(token.$creationDate).toBeGreaterThan(0);
    delete token.$id;
    delete token.$creationDate;
    expect(token).toEqual({
      $type: 'token',
      $kind: 'user',
      $owner: 'b@b.com',
      rights: ['read', 'addAttachment'],
    });
  });

  test('token should give read access to non public data', async () => {
    const token = await couch.createUserToken('b@b.com');
    await expect(couch.getEntryById('A', 'a@a.com')).rejects.toThrow(
      'document not found',
    );
    const entry = await couch.getEntry('A', 'a@a.com', { token });
    expect(entry).toBeDefined();
  });

  test('token should give only the right for which it was created', async () => {
    const token = await couch.createUserToken('b@b.com', 'delete');
    await expect(couch.getEntryById('A', 'a@a.com', { token })).rejects.toThrow(
      'document not found',
    );
    await couch.deleteEntry('A', 'a@a.com', { token });
  });

  test('anonymous user should not be able to create a token', async () => {
    await expect(couch.createEntryToken('anonymous', 'A')).rejects.toThrow(
      'only a user can create a token',
    );
    await expect(couch.createUserToken('anonymous')).rejects.toThrow(
      'only a user can create a token',
    );
  });

  test('token should not accept invalid right', async () => {
    await expect(couch.createUserToken('a@a.com', 'test1')).rejects.toThrow(
      'invalid right: test1',
    );
    await expect(
      couch.createUserToken('a@a.com', ['read', 'test2']),
    ).rejects.toThrow('invalid right: test2');

    await expect(
      couch.createEntryToken('a@a.com', 'A', 'test1'),
    ).rejects.toThrow('invalid right: test1');
  });
});
