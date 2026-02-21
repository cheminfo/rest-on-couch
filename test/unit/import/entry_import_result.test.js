import { describe, it } from 'node:test';
import { expect } from 'chai';

import constants from '../../../src/constants.js';
import { EntryImportResult } from '../../../src/import/EntryImportResult.mjs';
import path from 'node:path';
import ImportContext from '../../../src/import/ImportContext.mjs';

const context = new ImportContext(
  path.join(
    import.meta.dirname,
    '../../homeDirectories/main/test-new-import/full/to_process/test.txt',
  ),
  'test-new-import',
);

function getValidResult(importType) {
  const result = new EntryImportResult(context);
  switch (importType) {
    case constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        owner: 'a@a.com',
        groups: ['groupRead'],
      });
      result.addAnalysis({
        reference: 'testRef',
        jpath: ['jpath', 'in', 'document'],
        metadata: {
          metaField: 'test',
        },
      });
      break;
    case constants.IMPORT_UPDATE_$CONTENT_ONLY:
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        owner: 'a@a.com',
      });
      break;
    case constants.IMPORT_UPDATE_FULL: {
      Object.assign(result, {
        id: 'test',
        kind: 'test',
        owner: 'a@a.com',
      });
      result.addDefaultAnalysis({
        reference: 'testRef',
        jpath: ['jpath', 'in', 'document'],
        metadata: {
          metaField: 'test',
        },
        attachment: {
          field: 'text',
          content_type: 'text/plain',
        },
      });

      const otherAnalysis = result.addAnalysis({
        jpath: ['jpath'],
        reference: 'ref',
      });
      otherAnalysis.addAttachment({
        contents: Buffer.from('the contents', 'utf-8'),
        filename: 'filename.txt',
        field: 'field',
        content_type: 'text/plain',
      });
      result.addGroup('group2');
      break;
    }
    default:
      throw new Error('Invalid import type');
  }

  return result;
}

describe('EntryImportResult', () => {
  it('valid import results', () => {
    // Valid results shouldn't throw
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT).check();
    getValidResult(constants.IMPORT_UPDATE_$CONTENT_ONLY).check();
  });

  it('throws when fields are missing - full upload', () => {
    // Mandotory fields
    checkWithoutEntryPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutEntryPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutEntryPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutEntryPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_FULL,
    );

    // Additional attachments
    checkWithoutAttachmentPropShouldThrow(
      'filename',
      'filename must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAnalysisPropShouldThrow(
      'jpath',
      'jpath must be of type Array',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'field',
      'field must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAnalysisPropShouldThrow(
      'reference',
      'reference must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'content_type',
      'content_type must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAnalysisPropShouldThrow(
      'metadata',
      'metadata must be of type Object',
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
    checkWithoutAttachmentPropShouldThrow(
      'content_type',
      'content_type must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutEntryPropShouldThrow(
      'metadata',
      'metadata must be of type Object',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAttachmentPropShouldThrow(
      'field',
      'field must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );
    checkWithoutAnalysisPropShouldThrow(
      'reference',
      'reference must be of type String',
      constants.IMPORT_UPDATE_FULL,
    );

    // Import without attachment
  });

  it('throws when fields are missing - without attachment', () => {
    checkWithoutEntryPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutEntryPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutEntryPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
    checkWithoutEntryPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT,
    );
  });

  it('throws when fields are missing - content only', () => {
    checkWithoutEntryPropShouldThrow(
      'id',
      'id must be defined',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutEntryPropShouldThrow(
      'kind',
      'kind must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutEntryPropShouldThrow(
      'owner',
      'owner must be of type String',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
    checkWithoutEntryPropShouldThrow(
      'groups',
      'groups must be of type Array',
      constants.IMPORT_UPDATE_$CONTENT_ONLY,
    );
  });

  it('should fail to update the same field multiple times', () => {
    const result = new EntryImportResult(context);
    result.owner = 'a@a.com';
    result.id = 'test';
    result.kind = 'sample';
    const analysis = result.addAnalysis({
      reference: 'testRef',
      jpath: ['jpath', 'in', 'document'],
      metadata: {
        metaField: 'test',
      },
    });
    analysis.addAttachment({
      contents: Buffer.from('the contents', 'utf-8'),
      filename: 'one.txt',
      field: 'field',
      content_type: 'text/plain',
    });
    analysis.addAttachment({
      contents: Buffer.from('the contents', 'utf-8'),
      filename: 'two.txt',
      field: 'field',
    });

    expect(() => {
      result.check();
    }).toThrow(
      'Several attachments target the same field on the same analysis',
    );
  });

  it('invalid skipped results fail the check', () => {
    const result = new EntryImportResult(context);
    result.skip();
    expect(() => result.check()).toThrow(/id must be defined/);
  });

  it('cannot add contents to default analysis', () => {
    const result = new EntryImportResult(context);
    expect(() =>
      result.addDefaultAnalysis({
        reference: 'testRef',
        jpath: ['jpath', 'in', 'document'],
        attachment: {
          field: 'field',
          contents: Buffer.from('the contents', 'utf-8'),
          content_type: 'text/plain',
        },
      }),
    ).toThrow(
      /An attachment contents cannot be defined on the default analysis/,
    );
  });
});

function checkWithoutEntryPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);

  delete importResult[prop];
  expect(() => {
    importResult.check();
  }).toThrow(message);
}

function checkWithoutAnalysisPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);
  delete importResult.analyses[0][prop];
  expect(() => {
    importResult.check();
  }).toThrow(message);
}

function checkWithoutAttachmentPropShouldThrow(prop, message, importType) {
  const importResult = getValidResult(importType);
  delete importResult.analyses[0].attachments[0][prop];
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
  importResult.analyses[0].attachments[0][prop] = value;
  expect(() => {
    importResult.check();
  }).toThrow(message);
}
