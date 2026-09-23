import { describe, it } from 'node:test';
import { expect } from 'chai';

import constants from '../../../src/constants.js';
import { LegacyImportResult } from '../../../src/import/LegacyImportResult.mjs';
import ImportContext from '../../../src/import/ImportContext.mjs';
import path from 'node:path';

const context = new ImportContext(
  path.join(
    import.meta.dirname,
    '../../homeDirectories/main/test-import-legacy/full/to_process/test.txt',
  ),
  'test-import-legacy',
);

function getValidResult(importType) {
  const result = new LegacyImportResult(context);
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
          metaField: 'test',
        },
      });
      result.skipAttachment();
      break;
    case constants.IMPORT_UPDATE_$CONTENT_ONLY:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        reference: 'testRef',
        owner: 'a@a.com',
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
          metaField: 'test',
        },
      });
      result.addAttachment({
        jpath: ['jpath'],
        content_type: 'text/plain',
        contents: Buffer.from('the contents', 'utf-8'),
        filename: 'filename.txt',
        field: 'field',
        reference: 'ref',
      });
      result.addGroup('group2');
      break;
    default:
      throw new Error('Invalid import type');
  }

  return result;
}

describe('LegacyImportResult', () => {
  it('valid import results', () => {
    // Valid results shouldn't throw
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_$CONTENT_ONLY).check();
  });

  it('valid update type', () => {
    // Check type of update
    expect(getValidResult(constants.IMPORT_UPDATE_FULL).getUpdateType()).toBe(
      constants.IMPORT_UPDATE_FULL,
    );
    expect(
      getValidResult(
        constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
      ).getUpdateType(),
    ).toBe(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT);
    expect(
      getValidResult(constants.IMPORT_UPDATE_$CONTENT_ONLY).getUpdateType(),
    ).toBe(constants.IMPORT_UPDATE_$CONTENT_ONLY);
  });

  it('throws when fields are missing - full upload', () => {
    // Mandotory fields
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_FULL,
    );

    // Additional attachments
    // Filename of the context (imported file) is used by default
    checkWithoutAttachmentPropShouldThrow(
      'filename',
      'filename must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'jpath',
      'jpath must be of type Array',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'field',
      'field must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'reference',
      'reference must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'content_type',
      'content_type must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'contents',
      'contents must be a Buffer or TypedArray',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithWrongTypeAttachmentPropShouldThrow(
      'contents',
      'this is a string',
      'contents must be a Buffer or TypedArray',
      constants.IMPORT_UPDATE_FULL,
    );

    // Full import
    checkWithoutPropShouldThrow(
      'content_type',
      'content_type must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutPropShouldThrow(
      'field',
      'field must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutPropShouldThrow(
      'reference',
      'reference must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );

    // Import without attachment
  });

  it('throws when fields are missing - without attachment', () => {
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
  });

  it('throws when fields are missing - content only', () => {
    checkWithoutPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
  });

  it('Cannot skip metadata without skipping attachment', () => {
    const result = new LegacyImportResult(context);
    result.skipMetadata();
    expect(() => {
      result.getUpdateType();
    }).toThrow('Cannot skip metadata without skipping attachment');
  });

  it('should fail to update the same field multiple times', () => {
    const result = new LegacyImportResult(context);
    result.owner = 'a@a.com';
    result.id = 'test';
    result.kind = 'sample';
    result.reference = 'testRef';
    result.jpath = ['jpath', 'in', 'document'];
    result.field = 'field';
    result.addAttachment({
      reference: 'testRef',
      jpath: ['jpath', 'in', 'document'],
      field: 'field',
      contents: Buffer.from('the contents', 'utf-8'),
      filename: 'one.txt',
      content_type: 'text/plain',
    });

    expect(() => {
      result.check();
    }).toThrow('Several attachments target the same field');
  });

  it('should fail when several attachments of an analysis have the same filename', () => {
    // The main attachment and an additional attachment of the same analysis
    // would resolve to the same couchdb attachment name (jpath + filename)
    const result = new LegacyImportResult(context);
    Object.assign(result, {
      id: 'test',
      kind: 'sample',
      owner: 'a@a.com',
      reference: 'testRef',
      jpath: ['jpath', 'in', 'document'],
      field: 'text',
      filename: 'same.txt',
      content_type: 'text/plain',
      metadata: {},
    });
    result.addAttachment({
      reference: 'testRef',
      jpath: ['jpath', 'in', 'document'],
      field: 'other',
      filename: 'same.txt',
      content_type: 'text/plain',
      contents: Buffer.from('the contents', 'utf-8'),
    });

    expect(() => {
      result.check();
    }).toThrow(
      'Several attachments have the same filename "jpath/in/document/same.txt"',
    );
  });

  it('should fail when attachments of different analyses have the same filename', () => {
    const result = new LegacyImportResult(context);
    Object.assign(result, {
      id: 'test',
      kind: 'sample',
      owner: 'a@a.com',
      reference: 'testRef',
      jpath: ['jpath', 'in', 'document'],
      field: 'text',
      filename: 'same.txt',
      content_type: 'text/plain',
      metadata: {},
    });
    result.addAttachment({
      reference: 'otherRef',
      jpath: ['jpath', 'in', 'document'],
      field: 'text',
      filename: 'same.txt',
      content_type: 'text/plain',
      contents: Buffer.from('the contents', 'utf-8'),
    });

    expect(() => {
      result.check();
    }).toThrow(
      'Several attachments have the same filename "jpath/in/document/same.txt"',
    );
  });

  it('invalid skipped results fail the check', () => {
    const result = new LegacyImportResult(context);
    result.skip();
    expect(() => result.check()).toThrow(/id must be defined/);
  });

  it('cannot use non-legacy APIs', () => {
    const result = new LegacyImportResult(context);
    expect(() => result.addDefaultAnalysis()).toThrow(
      /addDefaultAnalysis is reserved to the new import API/,
    );

    expect(() => result.addAnalysis()).toThrow(
      /addAnalysis is reserved to the new import API/,
    );
  });
});

function checkWithoutPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);
  expect(importResult[prop]).toBeDefined();
  delete importResult[prop];
  expect(() => {
    importResult.check();
  }).toThrow(message);
}

function checkWithoutAttachmentPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);
  expect(importResult.attachments[0][prop]).toBeDefined();
  delete importResult.attachments[0][prop];
  expect(() => {
    importResult.check();
  }).toThrow(message);
}

function checkWithWrongTypeAttachmentPropShouldThrow(
  prop,
  value,
  message,
  importType,
) {
  const importResult = getValidResult(importType);
  importResult.attachments[0][prop] = value;
  expect(() => {
    importResult.check();
  }).toThrow(message);
}
