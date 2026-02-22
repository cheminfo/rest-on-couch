/* eslint-disable camelcase */

'use strict';

const { deepmergeInto } = require('deepmerge-ts');

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:attachment');

const nanoMethods = require('./nano');

const methods = {
  async addAttachments(uuid, user, attachments, options) {
    let entry;
    if (typeof uuid === 'object') {
      entry = uuid;
      uuid = entry._id;
    }
    debug('addAttachments (%s, %s)', uuid, user);
    if (!Array.isArray(attachments)) {
      attachments = [attachments];
    }
    // This acts as a rights check.
    const dbEntry = await this.getEntryWithRights(
      uuid,
      user,
      ['write', 'addAttachment'],
      options,
    );
    if (!entry) {
      entry = dbEntry;
    }
    const response = await this._db.attachFiles(entry, attachments);
    return response.body;
  },

  async deleteAttachment(uuid, user, attachmentName, options) {
    debug('deleteAttachment (%s, %s)', uuid, user);
    const entry = await this.getEntryWithRights(
      uuid,
      user,
      ['delete', 'addAttachment'],
      options,
    );
    if (!entry._attachments[attachmentName]) {
      return false;
    }
    delete entry._attachments[attachmentName];
    return nanoMethods.saveEntry(this._db, entry, user);
  },

  async getAttachmentByName(uuid, name, user, asStream, options) {
    debug('getAttachmentByName (%s, %s, %s)', uuid, name, user);
    const entry = await this.getEntry(uuid, user, options);
    return getAttachmentFromEntry(entry, this, name, asStream);
  },

  /**
   * This function should be called with a validated `analyses` parameter, using `EntryImportResult.getAnalyses()`
   * - id: used to find the appropriate document. Method will throw if document is not found.
   * - user: user modifying the entry
   * - analyses[]:
   *   - jpath: The jpath to which the analysis should be added or updated. The jpath should point to an array or a non-existing property (will create the array).
   *   - reference: the identifier of the analysis within the array pointed by the jpath. Used to determine if a pre-existing analysis can be updated, or if a new analysis should be pushed to the array.
   *   - metadata: custom metadata properties to set on the analysis. If the analysis exists it will do a deep shallow merge with the existing metadata.
   *   - attachments[] - each analysis can reference multiple attachments.
   *     - field: field in the metadata which contains the reference to the couchdb attachment.
   *     - filename: name of the attachment
   *     - content_type: Content-Type of the attachment
   *     - contents: contents of the attachment (Buffer or TypedArray)
   * - newContent: object to deep-merge with existing entry.
   */
  async addFileToJpath(id, user, analyses, newContent) {
    debug('addFileToJpath (%s, %s)', id, user);
    const dateNow = Date.now();

    const entry = await this.getEntryById(id, user);
    const current = entry.$content || {};

    if (newContent) {
      debug.trace('extend current content with new content');
      deepmergeInto(current, newContent);
    }

    debug.trace('prepare entry and attachments data');
    const documentAttachments = [];
    for (let analysis of analyses) {
      let currentAnalysis = current;
      const { jpath, reference, metadata = {}, attachments } = analysis;

      let analysisMetadata = metadata ? structuredClone(metadata) : {};
      analysisMetadata.$modificationDate = dateNow;

      for (var i = 0; i < jpath.length; i++) {
        let newCurrent = currentAnalysis[jpath[i]];
        if (!newCurrent) {
          if (i < jpath.length - 1) {
            currentAnalysis[jpath[i]] = {};
          } else {
            currentAnalysis[jpath[i]] = [];
          }
          newCurrent = currentAnalysis[jpath[i]];
        }
        currentAnalysis = newCurrent;
      }

      if (!Array.isArray(currentAnalysis)) {
        throw new CouchError('jpath must point to an array');
      }

      let found = currentAnalysis.find((el) => el.reference === reference);
      if (found) {
        Object.assign(found, analysisMetadata);
        analysisMetadata = found;
      } else {
        analysisMetadata.reference = reference;
        currentAnalysis.push(
          Object.assign(analysisMetadata, { $creationDate: Date.now() }),
        );
      }

      for (let attachment of attachments) {
        const { field, filename, contents, content_type } = attachment;
        analysisMetadata[field] = {
          filename,
        };
        const documentAttachment = {
          reference,
          field,
          name: filename,
          data:
            typeof contents === 'string'
              ? Buffer.from(contents, 'base64')
              : contents,
          content_type,
        };
        documentAttachments.push(documentAttachment);
      }
    }

    if (documentAttachments.length === 0) {
      return this.insertEntry(entry, user);
    } else {
      return this.addAttachments(entry, user, documentAttachments);
    }
  },
};

methods.addAttachment = methods.addAttachments;

async function getAttachmentFromEntry(entry, ctx, name, asStream) {
  if (entry._attachments && entry._attachments[name]) {
    return ctx._db.getAttachment(entry._id, name, asStream, {
      rev: entry._rev,
    });
  } else {
    throw new CouchError(`attachment ${name} not found`, 'not found');
  }
}

module.exports = {
  methods,
};
