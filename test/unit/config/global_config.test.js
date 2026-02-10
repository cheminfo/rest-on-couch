import { describe, it } from 'node:test';
import { expect } from 'chai';
import { getGlobalConfig } from '../../../src/config/config.js';

describe('initialization of global configuration properties', () => {
  it('should init proxyPrefix', () => {
    const config = getGlobalConfig({ proxyPrefix: 'roc/' });
    expect(config.proxyPrefix).toBe('/roc');
  });

  it('should init publicAddress', () => {
    const config = getGlobalConfig({
      publicAddress: 'http://127.0.0.1:3300/roc/',
    });
    expect(config.publicAddress).toBe('http://127.0.0.1:3300/roc');
  });

  it('should accept non-email strings in rights (e.g. group names)', () => {
    const config = getGlobalConfig({
      rights: {
        read: ['anyuser', 'group1', 'myGroup'],
        create: ['user@example.com', 'admins'],
      },
    });
    expect(config.rights.read).toEqual(['anyuser', 'group1', 'myGroup']);
    expect(config.rights.create).toEqual(['user@example.com', 'admins']);
  });
});
