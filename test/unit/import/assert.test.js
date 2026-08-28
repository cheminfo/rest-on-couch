import { describe, it } from 'node:test';

import { expect } from 'chai';

import {
  assertDefined,
  assertIsPlainJSONObject,
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

describe('assertIsPlainJSONObject', () => {
  it('should accept undefined anywhere', () => {
    expect(() => assertIsPlainJSONObject(undefined, 'value')).not.toThrow();
    expect(() =>
      assertIsPlainJSONObject({ a: undefined }, 'value'),
    ).not.toThrow();
    expect(() =>
      assertIsPlainJSONObject({ a: [undefined] }, 'value'),
    ).not.toThrow();
    expect(() =>
      assertIsPlainJSONObject({ a: { b: undefined } }, 'value'),
    ).not.toThrow();
  });

  it('should accept plain JSON objects', () => {
    expect(() => assertIsPlainJSONObject({}, 'value')).not.toThrow();
    expect(() =>
      assertIsPlainJSONObject(
        { a: 1, b: 'two', c: null, d: true, e: [1, { f: 2 }] },
        'value',
      ),
    ).not.toThrow();
  });

  it('should throw for non plain objects', () => {
    expect(() => assertIsPlainJSONObject(null, 'value')).toThrow(
      'value must be a plain JSON object',
    );
    expect(() => assertIsPlainJSONObject([], 'value')).toThrow(
      'value must be a plain JSON object',
    );
    expect(() => assertIsPlainJSONObject('abc', 'value')).toThrow(
      'value must be a plain JSON object',
    );
    expect(() => assertIsPlainJSONObject(new Date(), 'value')).toThrow(
      'value must be a plain JSON object',
    );
  });

  it('should throw for non JSON-serializable values', () => {
    expect(() => assertIsPlainJSONObject({ a: Math.max }, 'value')).toThrow(
      'value must be a plain JSON object',
    );
    expect(() => assertIsPlainJSONObject({ a: [1, 2n] }, 'value')).toThrow(
      'value must be a plain JSON object',
    );
    expect(() =>
      assertIsPlainJSONObject({ a: { b: new Map() } }, 'value'),
    ).toThrow('value must be a plain JSON object');
  });
});
