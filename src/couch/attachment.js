'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:attachment');
const nanoPromise = require('../util/nanoPromise');
const nanoMethods = require('./nano');

const methods = {
    async addAttachmentsById(id, user, attachments) {
        debug(`addAttachmentsById (${id}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByIdAndRights(id, user, ['write', 'addAttachment']);
        return nanoPromise.attachFiles(this._db, entry, attachments);
    },

    async addAttachmentsByUuid(uuid, user, attachments) {
        debug(`addAttachmentsByUuid (${uuid}, ${user})`);
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['write', 'addAttachment']);
        return nanoPromise.attachFiles(this._db, entry, attachments);
    },

    async deleteAttachmentByUuid(uuid, user, attachmentName) {
        debug(`deleteAttachmentByUuid (${uuid}, ${user})`);
        const entry = await this.getEntryByUuidAndRights(uuid, user, ['delete', 'addAttachment']);
        if (!entry._attachments[attachmentName]) {
            return false;
        }
        delete entry._attachments[attachmentName];
        return nanoMethods.saveEntry(this._db, entry, user);
    },

    getAttachmentByIdAndName(id, name, user, asStream, options) {
        debug(`getAttachmentByIdAndName (${id}, ${name}, ${user})`);
        return this.getEntryById(id, user, options)
            .then(getAttachmentFromEntry(this, name, asStream));
    },

    getAttachmentByUuidAndName(uuid, name, user, asStream, options) {
        debug(`getAttachmentByUuidAndName (${uuid}, ${name}, ${user})`);
        return this.getEntryByUuid(uuid, user, options)
            .then(getAttachmentFromEntry(this, name, asStream));
    }
};

methods.addAttachmentById = methods.addAttachmentsById;
methods.addAttachmentByUuid = methods.addAttachmentsByUuid;

function getAttachmentFromEntry(ctx, name, asStream) {
    return async function (entry) {
        if (entry._attachments && entry._attachments[name]) {
            return nanoPromise.getAttachment(ctx._db, entry._id, name, asStream, {rev: entry._rev});
        } else {
            throw new CouchError(`attachment ${name} not found`, 'not found');
        }
    };
}

module.exports = {
    methods
};
