import { describe, it } from 'node:test';
import { expect } from 'chai';
import { alterEntryProxyHandler } from '../../../src/config/config_proxies.mjs';

const testEntry = {
  _id: 'test',
  _rev: '1-test',
  $content: {
    arr: [1, 2, 3],
    a: {
      b: 'ok',
    },
  },
  $owners: ['admin@cheminfo.org', 'test-group'],
};
describe('Accessing private properties', () => {
  const privateProperties = ['_id', '_rev'];
  for (const prop of privateProperties) {
    it(`${prop} cannot be accessed`, () => {
      const proxied = createProxy();
      expect(() => proxied[prop]).toThrow(`accessing ${prop} is not allowed`);
    });
  }
});

describe('Accessing and mutating $content', () => {
  it('can read nested $content properties', () => {
    const proxied = createProxy();
    expect(proxied.$content.a.b).toBe('ok');
    expect(proxied.$content.arr[1]).toBe(2);
  });

  it('can mutate nested $content properties', () => {
    const proxied = createProxy();

    proxied.$content.a.b = 'changed';
    proxied.$content.arr[1] = 42;
    expect(proxied.$content.a.b).toBe('changed');
    expect(proxied.$content.arr[1]).toBe(42);
  });
});

describe('Accessing and mutating $owners', () => {
  it('can read $owners', () => {
    const proxied = createProxy();

    const firstOwner = proxied.$owners[0];
    expect(firstOwner).toBe('admin@cheminfo.org');
  });

  it('can mutate group', () => {
    const proxied = createProxy();
    proxied.$owners[1] = 'other_group';
    expect(proxied.$owners[1]).toBe('other_group');
  });

  it('can add group', () => {
    const proxied = createProxy();
    proxied.$owners.push('new_group');
    expect(proxied.$owners[2]).toBe('new_group');
  });

  it('can access length property', () => {
    const proxied = createProxy();
    expect(proxied.$owners.length).toBe(2);
  });

  it('cannot mutate primary owner', () => {
    const proxied = createProxy();

    expect(() => {
      proxied.$owners[0] = 'new_owner@cheminfo.org';
    }).toThrow('You cannot set the first element of $owners (primary user)');
  });
});

function createProxy() {
  return new Proxy(structuredClone(testEntry), alterEntryProxyHandler);
}
