import { isValidOwner } from '../couch/util.js';

export const alterEntryProxyHandler = {
  get(target, prop) {
    switch (prop) {
      case '$content':
        return target.$content;
      case '$owners':
        return new Proxy(target.$owners, alterOwnersProxyHandler);
      default:
        throw new Error(`accessing ${prop} is not allowed`);
    }
  },
};

export const alterOwnersProxyHandler = {
  get(target, prop) {
    const value = target[prop];
    if (typeof value === 'function') {
      if (!allowedMethods.includes(prop)) {
        throw new Error(`You cannot use ${prop}`);
      }
    }
    return target[prop];
  },
  set(target, prop, value) {
    if (prop === '0') {
      throw new Error(
        `You cannot set the first element of $owners (primary user)`,
      );
    }

    if (!isValidOwner(value)) {
      throw new Error(`${value} is not a valid owner`);
    }
    target[prop] = value;
    return true;
  },
};

const allowedMethods = [
  'map',
  'findIndex',
  'find',
  'filter',
  'every',
  'includes',
  'some',
  'reduce',
  'forEach',
  'push',
  Symbol.iterator,
];
