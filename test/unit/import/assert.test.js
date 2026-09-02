import { describe, it } from 'node:test';

import { expect } from 'chai';

import {
  assertDefined,
  assertIsObjectOfSimplePrimitives,
  assertType,
} from '../../../src/import/assert.mjs';

describe('assertType', () => {
  it('should accept values of the expected type', () => {
    expect(() => assertType('abc', 'String', 'value')).not.toThrow();
    expect(() => assertType([], 'Array', 'value')).not.toThrow();
    expect(() => assertType({}, 'Object', 'value')).not.toThrow();
    expect(() => assertType(42, 'Number', 'value')).not.toThrow();
  });

  it('should throw for values of another type', () => {
    expect(() => assertType(42, 'String', 'value')).toThrow(
      'value must be of type String',
    );
    expect(() => assertType([], 'Object', 'value')).toThrow(
      'value must be of type Object',
    );
    expect(() => assertType(undefined, 'String', 'value')).toThrow(
      'value must be of type String',
    );
  });

  it('should work without error prefix', () => {
    expect(() => assertType(42, 'String')).toThrow(' must be of type String');
  });
});

describe('assertDefined', () => {
  it('should accept any defined value', () => {
    expect(() => assertDefined(null, 'value')).not.toThrow();
    expect(() => assertDefined(0, 'value')).not.toThrow();
    expect(() => assertDefined('', 'value')).not.toThrow();
  });

  it('should throw when the value is undefined', () => {
    expect(() => assertDefined(undefined, 'value')).toThrow(
      'value must be defined',
    );
  });
});

describe('assertIsObjectOfSimplePrimitives', () => {
  it('should accept undefined anywhere', () => {
    expect(() =>
      assertIsObjectOfSimplePrimitives(undefined, 'value'),
    ).not.toThrow();
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: undefined }, 'value'),
    ).not.toThrow();
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: [undefined] }, 'value'),
    ).not.toThrow();
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: { b: undefined } }, 'value'),
    ).not.toThrow();
  });

  it('should accept object of simple primitives', () => {
    expect(() => assertIsObjectOfSimplePrimitives({}, 'value')).not.toThrow();
    expect(() =>
      assertIsObjectOfSimplePrimitives(
        { a: 1, b: 'two', c: null, d: true, e: [1, { f: 2 }] },
        'value',
      ),
    ).not.toThrow();
  });

  it('should throw for non plain objects', () => {
    expect(() => assertIsObjectOfSimplePrimitives(null, 'value')).toThrow(
      /must be an object made of simple primitives/,
    );
    expect(() => assertIsObjectOfSimplePrimitives([], 'value')).toThrow(
      /must be an object made of simple primitives/,
    );
    expect(() => assertIsObjectOfSimplePrimitives('abc', 'value')).toThrow(
      /must be an object made of simple primitives/,
    );
    expect(() => assertIsObjectOfSimplePrimitives(new Date(), 'value')).toThrow(
      /must be an object made of simple primitives/,
    );
  });

  it('should throw for non JSON-serializable values', () => {
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: Math.max }, 'value'),
    ).toThrow(/must be an object made of simple primitives/);
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: [1, 2n] }, 'value'),
    ).toThrow(/must be an object made of simple primitives/);
    expect(() =>
      assertIsObjectOfSimplePrimitives({ a: { b: new Map() } }, 'value'),
    ).toThrow(/must be an object made of simple primitive/);
  });
});
