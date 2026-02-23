/* eslint-disable camelcase */

/**
 * @typedef {import("./ImportAnalysis.mjs").Analysis & import("./ImportAnalysis.mjs").AnalysisAttachment} ImportAttachmentWithData
 * @typedef {import("./ImportAnalysis.mjs").Analysis | ImportAttachmentWithData} ImportAttachment
 */

import constants from '../constants.js';
import { checkEntry } from './assert.mjs';
import { ImportAnalysis } from './ImportAnalysis.mjs';
import { EntryImportResult } from './EntryImportResult.mjs';

export class LegacyImportResult extends EntryImportResult {
  #attachmentIsSkipped = false;
  #metadataIsSkipped = false;
  filename = null;
  content = {};
  metadata = null;
  attachments = [];
  content_type = 'application/octet-stream';

  // Based on the kind of information provided,
  getUpdateType() {
    if (!this.#attachmentIsSkipped && !this.#metadataIsSkipped) {
      return constants.IMPORT_UPDATE_FULL;
    } else if (!this.#metadataIsSkipped && this.#attachmentIsSkipped) {
      return constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT;
    } else if (this.#attachmentIsSkipped && this.#metadataIsSkipped) {
      return constants.IMPORT_UPDATE_$CONTENT_ONLY;
    } else {
      throw new Error('Cannot skip metadata without skipping attachment');
    }
  }

  /**
   *
   * @param {ImportAttachment} attachment
   */
  addAttachment(attachment) {
    this.attachments.push({
      ...attachment,
      metadata: attachment.metadata || {},
    });
  }
  /**
   * Check the validity the result.
   * Skipped entries are also checked.
   */
  check() {
    // Check that required properties are set with correct type
    checkEntry(this);
    const analyses = this.getAnalyses();
    for (let analysis of analyses) {
      analysis.check();
    }
  }

  // Don't add the main attachment to the database
  skipAttachment() {
    this.#attachmentIsSkipped = true;
  }

  skipMetadata() {
    this.#metadataIsSkipped = true;
  }

  addAnalysis() {
    throw new Error(
      'addAnalysis is reserved to the new import API but you are using the legacy one. Change for the new API or use addAttachment() instead',
    );
  }

  addDefaultAnalysis() {
    throw new Error(
      'addDefaultAnalysis is reserved to the new import API but you are using the legacy one. Change for the new API or define the default import by setting properties like `jpath`, `reference` and `field`',
    );
  }

  /**
   * A compatibility layer which transforms the state in this legacy class into a regular list of analyses.
   * @returns {Promise<ImportAnalysis[]>}
   */
  getAnalyses() {
    const importAttachments = [];
    switch (this.getUpdateType()) {
      case constants.IMPORT_UPDATE_FULL: {
        const mainFilename =
          this.filename === null ? this._context.filename : this.filename;
        importAttachments.push({
          reference: this.reference,
          jpath: this.jpath,
          metadata: this.metadata,
          field: this.field,
          filename: mainFilename,
          contents: this._context.getContentsSync(),
          content_type: this.content_type,
        });
        break;
      }

      case constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT: {
        importAttachments.push({
          jpath: this.jpath,
          reference: this.reference,
          metadata: this.metadata,
        });
        break;
      }

      case constants.IMPORT_UPDATE_$CONTENT_ONLY: {
        // Nothing to do
        break;
      }

      default: {
        throw new Error('Unreachable');
      }
    }

    importAttachments.push(...this.attachments);
    const analyses = Object.values(
      Object.groupBy(
        importAttachments,
        (attachment) => attachment.reference + String(attachment.jpath),
      ),
    ).map((attachments) => {
      const analysis = new ImportAnalysis({
        reference: attachments[0].reference,
        jpath: attachments[0].jpath,
        metadata: attachments[0].metadata,
      });
      for (let attachment of attachments) {
        const { field, filename, contents, content_type } = attachment;
        if (analysis.metadata || attachment.metadata) {
          analysis.metadata = {
            ...analysis.metadata,
            ...attachment.metadata,
          };
        }

        if (filename || field || contents) {
          analysis.addAttachment({
            filename,
            field,
            contents,
            content_type,
          });
        }
      }
      return analysis;
    });

    for (let analysis of analyses) {
      analysis.check();
    }
    return analyses;
  }
}
