'use strict';

const ImportResult = require('../../src/import/ImportResult');
const constants = require('../../src/constants');

function getValidResult(importType) {
  const result = new ImportResult();
  switch (importType) {
    case constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        reference: 'testRef',
        owner: 'a@a.com',
        groups: ['groupRead'],
        jpath: ['jpath', 'in', 'document'],
        field: 'text',
        metadata: {
          metaField: 'test'
        }
      });
      result.skipAttachment();
      break;
    case constants.IMPORT_UPDATE_$CONTENT_ONLY:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        reference: 'testRef',
        owner: 'a@a.com'
      });
      result.skipAttachment();
      result.skipMetadata();
      break;
    case constants.IMPORT_UPDATE_FULL:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        reference: 'testRef',
        owner: 'a@a.com',
        jpath: ['jpath', 'in', 'document'],
        field: 'text',
        content_type: 'text/plain',
        metadata: {
          metaField: 'test'
        }
      });
      result.addAttachment({
        jpath: ['jpath'],
        content_type: 'text/plain',
        contents: Buffer.from('the contents', 'utf-8'),
        filename: 'filename.txt',
        field: 'field',
        reference: 'ref'
      });
      result.addGroup('group2');
      break;
    default:
      throw new Error('Invalid import type');
  }

  return result;
}

describe('ImportResult', () => {
  test('valid import results', () => {
    // Valid results shouldn't throw
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_$CONTENT_ONLY).check();
  });

  test('valid update type', () => {
    // Check type of update
    expect(getValidResult(constants.IMPORT_UPDATE_FULL).getUpdateType()).toBe(
      constants.IMPORT_UPDATE_FULL
    );
    expect(
      getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).getUpdateType()
    ).toBe(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT);
    expect(
      getValidResult(constants.IMPORT_UPDATE_$CONTENT_ONLY).getUpdateType()
    ).toBe(constants.IMPORT_UPDATE_$CONTENT_ONLY);
  });

  test('throws when fields are missing - full upload', () => {
    // Mandotory fields
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_FULL
    );

    // Additional attachments
    checkWithoutAttachmentPropShouldThrow(
      'filename',
      'In attachment: filename must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'jpath',
      'In attachment: jpath must be of type Array',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'field',
      'In attachment: field must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'reference',
      'In attachment: reference must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'content_type',
      'In attachment: content_type must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'metadata',
      'In attachment: metadata must be of type Object',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutAttachmentPropShouldThrow(
      'contents',
      'In attachment: contents must be a Buffer or TypedArray',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithWrongTypeAttachmentPropShouldThrow(
      'contents',
      'this is a string',
      'In attachment: contents must be a Buffer or TypedArray',
      constants.IMPORT_UPDATE_FULL
    );

    // Full import
    checkWithoutPropShouldThrow(
      'content_type',
      'content_type must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'metadata',
      'metadata must be of type Object',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'field',
      'field must be of type String',
      constants.IMPORT_UPDATE_FULL
    );
    checkWithoutPropShouldThrow(
      'reference',
      'reference must be of type String',
      constants.IMPORT_UPDATE_FULL
    );

    // Import without attachment
  });

  test('throws when fields are missing - without attachment', () => {
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT
    );
  });

  test('throws when fields are missing - content only', () => {
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_$CONTENT_ONLY
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_$CONTENT_ONLY
    );
  });

  test('Cannot skip metadata without skipping attachment', () => {
    const result = new ImportResult();
    result.skipMetadata();
    expect(function () {
      result.getUpdateType();
    }).toThrowError('Cannot skip metadata without skipping attachment');
  });
});

function checkWithoutPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);

  delete importResult[prop];
  expect(function () {
    importResult.check();
  }).toThrowError(message);
}

function checkWithoutAttachmentPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);
  delete importResult.attachments[0][prop];
  expect(function () {
    importResult.check();
  }).toThrowError(message);
}

function checkWithWrongTypeAttachmentPropShouldThrow(
  prop,
  value,
  message,
  importType
) {
  const importResult = getValidResult(importType);
  importResult.attachments[0][prop] = value;
  expect(function () {
    importResult.check();
  }).toThrowError(message);
}
