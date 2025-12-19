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
});
