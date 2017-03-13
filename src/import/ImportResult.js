'use strict';

const constants = require('../constants');

module.exports = class ImportResult {
    constructor() {
        this.attachments = [];
        this.content_type = 'application/octet-stream';
        this.groups = [];
        this.$content = {};
    }

    skip() {
        this.isSkipped = true;
    }

    // Based on the kind of information provided,
    getUpdateType() {
        if (!this.attachmentIsSkipped && !this.metadataIsSkipped) {
            return constants.IMPORT_UPDATE_FULL;
        } else if (!this.metadataIsSkipped && this.attachmentIsSkipped) {
            return constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT;
        } else if (this.attachmentIsSkipped && this.metadataIsSkipped) {
            return constants.IMPORT_UPDATE_$CONTENT_ONLY;
        } else {
            throw new Error('Cannot skip metadata without skipping attachment');
        }
    }

    check() {
        // Check that required properties are set with correct type
        const updateType = this.getUpdateType();

        // Always required
        assertDefined(this.$id, '$id');
        assertType(this.owner, 'String', 'owner');
        assertType(this.kind, 'String', 'kind');
        assertType(this.groups, 'Array', 'groups');
        assertType(this.$content, 'Object', '$content');
        assertType(this.attachments, 'Array', 'attachments');
        for (let i = 0; i < this.attachments.length; i++) {
            assertType(this.attachments[i].field, 'String', 'In attachment: field');
            assertType(this.attachments[i].filename, 'String', 'In attachment: filename');
            assertType(this.attachments[i].content_type, 'String', 'In attachment: content_type');
            assertType(this.attachments[i].jpath, 'Array', 'In attachment: jpath');
            assertType(this.attachments[i].metadata, 'Object', 'In attachment: metadata');
            assertType(this.attachments[i].reference, 'String', 'In attachment: reference');
            assertDefined(this.attachments[i].contents, 'In attachment: contents');
        }

        // Required if an there is a jpath
        if (updateType === constants.IMPORT_UPDATE_FULL || updateType === constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT) {
            assertType(this.jpath, 'Array', 'jpath');
            assertType(this.reference, 'String', 'reference');
            assertType(this.metadata, 'Object', 'metadata');
        }

        if (updateType === constants.IMPORT_UPDATE_FULL) {
            assertType(this.content_type, 'String', 'content_type');
            assertType(this.field, 'String', 'field');
        }


    }

    addAttachment(attachment) {
        this.attachments.push(attachment);
    }

    // Don't add the main attachment to the database
    skipAttachment() {
        this.attachmentIsSkipped = true;
    }

    skipMetadata() {
        this.metadataIsSkipped = true;
    }

    addGroup(group) {
        this.groups.push(group);
    }

    addGroups(groups) {
        this.groups = this.groups.concat(groups);
    }
};

function assertType(data, expectedType, errorPrefix) {
    if (getType(data) !== expectedType) {
        throw new Error(`${errorPrefix || ''} should be ${expectedType}`);
    }
}

function assertDefined(data, errorPrefix) {
    if (data === undefined) {
        throw new Error(`${errorPrefix || ''} should be defined`);
    }
}

function getType(data) {
    return Object.prototype.toString.call(data).slice(8, -1);
}
