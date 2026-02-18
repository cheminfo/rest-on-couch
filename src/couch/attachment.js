/* eslint-disable camelcase */

'use strict';

const extend = require('extend');

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
   *   - jpath: The jpath to which the analysis should be added or updated (based on the reference existing or not). The jpath should always point to an array.
   *   - metadata: custom metadata fields
   *   - reference: the reference to this file. Used to identify a pre-existing file item with the same reference.
   *   - attachments[]:
   *     - field: field in the metadata which contains a reference to the attachment. A file item can contain multiple fields which reference different attachments.
   *     - filename: name of the attachment
   *     - content_type: Content-Type of the attachment
   *     - contents: contents of the attachment
   *
   *   or to merge into an existing element with the same reference
   * - file: object containing:
   *
   *
   * - newContent: object to deep-merge with the found document. New content precedes over old content
   * - noFile: set to true if the attachment should not be added to the document
   */
  async addFileToJpath(id, user, analyses, newContent) {
    debug('addFileToJpath (%s, %s)', id, user);
    if (!Array.isArray(analyses)) {
      throw new CouchError('analyses must be an array');
    }
    const dateNow = Date.now();

    const entry = await this.getEntryById(id, user);
    const current = entry.$content || {};

    debug.trace('extend current content with new content');
    if (newContent) {
      extend(current, newContent);
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
