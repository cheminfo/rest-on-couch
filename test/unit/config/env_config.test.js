import { describe, it } from 'node:test';
import { expect } from 'chai';
import { getGlobalConfig } from '../../../src/config/config.js';

describe('REST_ON_COUCH_* environment properties', () => {
  it('environment booleans', () => {
    let config = getGlobalConfig();
    expect(config.proxy).toBe(true);
    expect(config.sessionSecure).toBe(false);

    process.env.REST_ON_COUCH_SESSION_SECURE = 'tru';
    expect(() => getGlobalConfig({})).toThrow(/Value must be a boolean/);

    process.env.REST_ON_COUCH_SESSION_SECURE = 'True';
    config = getGlobalConfig({});
    expect(config.sessionSecure).toBe(true);

    process.env.REST_ON_COUCH_PROXY = 'false';
    // We pass an empty config object to force reloading the configuration and not use the store
    config = getGlobalConfig({});
    expect(config.proxy).toBe(false);
  });

  it('environment integers', () => {
    let config = getGlobalConfig();
    expect(config.authRenewal).toBe(570);

    process.env.REST_ON_COUCH_AUTH_RENEWAL = '600x';
    expect(() => getGlobalConfig({})).toThrow(
      /Value must be a non-negative integer\n.*at authRenewal/,
    );

    process.env.REST_ON_COUCH_AUTH_RENEWAL = '600';
    config = getGlobalConfig({});
    expect(config.authRenewal).toBe(600);
  });
});
