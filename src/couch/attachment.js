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
    return this._db.attachFiles(entry, attachments);
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

  // - id: used to find the appropriate document. Method will throw if document is not found
  // - json: the content to push into the array pointed by the jpath,
  //   or to merge into an existing element with the same reference
  // - file: object containing:
  //   - reference: reference of this attachment
  //   - name: name of the attachment
  //   - data: content of the attachment
  //   - field: field in the json in which a ref to the attachment filename should be added
  // - newContent: object to deep-merge with the found document. New content precedes over old content
  // - noFile: set to true if the attachment should not be added to the document
  async addFileToJpath(id, user, jpath, json, file, newContent, noFile) {
    debug('addFileToJpath (%s, %s)', id, user);
    if (!Array.isArray(jpath)) {
      throw new CouchError('jpath must be an array');
    }
    if (typeof json !== 'object') {
      throw new CouchError('json must be an object');
    }
    json.$modificationDate = Date.now();
    if (typeof file !== 'object' || file === null) {
      throw new CouchError('file must be an object');
    }
    if (!noFile && (!file.field || !file.name || !file.data)) {
      throw new CouchError('file must have field, name and data properties');
    }

    const entry = await this.getEntryById(id, user);
    let current = entry.$content || {};

    debug.trace('extend current content with new content');
    if (newContent) {
      extend(current, newContent);
    }

    debug.trace('create structure to jpath');
    for (var i = 0; i < jpath.length; i++) {
      let newCurrent = current[jpath[i]];
      if (!newCurrent) {
        if (i < jpath.length - 1) {
          current[jpath[i]] = {};
        } else {
          current[jpath[i]] = [];
        }
        newCurrent = current[jpath[i]];
      }
      current = newCurrent;
    }
    if (!Array.isArray(current)) {
      throw new CouchError('jpath must point to an array');
    }

    if (!file.reference) {
      throw new Error('file must have a reference');
    }
    debug.trace('set metadata');

    let found = current.find((el) => el.reference === file.reference);
    if (found) {
      Object.assign(found, json);
      json = found;
    } else {
      json.reference = file.reference;
      current.push(Object.assign(json, { $creationDate: Date.now() }));
    }

    if (noFile) {
      debug.trace('noFile is true, saving without attachment');
      return this.insertEntry(entry, user);
    } else {
      debug.trace('add attachment');
      json[file.field] = {
        filename: file.name,
      };
      const fileCopy = { ...file };
      if (typeof fileCopy.data === 'string') {
        fileCopy.data = Buffer.from(fileCopy.data, 'base64');
      }
      return this.addAttachments(entry, user, file);
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
