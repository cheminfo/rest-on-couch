/* eslint-disable camelcase */

export function checkEntry(entry) {
  const { id, kind, owner, content, groups } = entry;
  assertDefined(id, 'id');
  assertType(owner, 'String', 'owner');
  assertType(kind, 'String', 'kind');
  assertType(content, 'Object', 'content');
  checkGroups(groups);
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
