/* eslint-disable camelcase */

export function checkEntry(entry) {
  const { id, kind, owner, content, groups, importLogData } = entry;
  assertDefined(id, 'id');
  assertType(owner, 'String', 'owner');
  assertType(kind, 'String', 'kind');
  assertType(content, 'Object', 'content');
  checkGroups(groups);
  assertIsObjectOfSimplePrimitives(importLogData, 'importLogData');
}

export function checkAnalysis(analysis) {
  const { jpath, reference, metadata } = analysis;
  assertType(reference, 'String', 'reference');
  assertType(jpath, 'Array', 'jpath');
  assertType(metadata, 'Object', 'metadata');
}

export function checkAttachment(attachment) {
  const { field, filename, contents, content_type } = attachment;
  assertType(field, 'String', 'field');
  assertType(filename, 'String', 'filename');
  assertType(content_type, 'String', 'content_type');
  assertTypedArray(contents, 'contents');
}

export function checkGroups(groups) {
  assertType(groups, 'Array', 'groups');
  for (let group of groups) {
    assertType(group, 'String', 'group item');
  }
}

export function assertType(data, expectedType, errorPrefix) {
  if (getType(data) !== expectedType) {
    throw new Error(`${errorPrefix || ''} must be of type ${expectedType}`);
  }
}

export function assertDefined(data, errorPrefix) {
  if (data === undefined) {
    throw new Error(`${errorPrefix || ''} must be defined`);
  }
}

function assertTypedArray(data, errorPrefix) {
  if (!ArrayBuffer.isView(data)) {
    throw new Error(`${errorPrefix || ''} must be a Buffer or TypedArray`);
  }
}

function getType(data) {
  return Object.prototype.toString.call(data).slice(8, -1);
}

export function assertIsObjectOfSimplePrimitives(data, errorPrefix) {
  if (data !== undefined && !isObjectOfSimplePrimitives(data)) {
    throw new Error(
      `${errorPrefix || ''} must be an object made of simple primitives (plain object, array, string, number or boolean)`,
    );
  }
}

function isObjectOfSimplePrimitives(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  // Reject non-plain objects (TypedArrays, Date, Map, Set, etc.)
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }

  return Object.values(value).every(isMadeOfSimplePrimitives);
}

function isMadeOfSimplePrimitives(value) {
  if (value === null || value === undefined) return true;
  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return true;
  }

  if (Array.isArray(value)) return value.every(isMadeOfSimplePrimitives);

  if (typeof value === 'object') {
    return isObjectOfSimplePrimitives(value);
  }

  // Rejects function, symbol, bigint
  return false;
}
