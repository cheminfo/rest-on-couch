import { checkAnalysis, checkAttachment } from './assert.mjs';
import ASCIIFolder from 'fold-to-ascii';

/**
 * @typedef {{
 *   reference: string;
 *   jpath: string[];
 *   metadata?: Record<string, unknown>;
 * }} Analysis
 */

/**
 * @typedef {{
 *   contents: ArrayBufferLike | Buffer;
 *   filename: string;
 *   field: string;
 *   content_type?: string;
 * }} AnalysisAttachment
 */

export class ImportAnalysis {
  /**
   * ImportAnalysis constructor
   * @param {Analysis} analysis
   */
  constructor(analysis) {
    this.reference = analysis.reference;
    this.jpath = analysis.jpath;
    this.metadata = analysis.metadata;
    this.attachments = [];
  }

  /**
   * Add an attachment to the analysis.
   * @param {AnalysisAttachment} attachment
   */
  addAttachment(attachment) {
    this.attachments.push({
      content_type: 'application/octet-stream',
      ...attachment,
      filename: attachment.filename
        ? generateFilename({
            jpath: this.jpath,
            filename: attachment.filename,
          })
        : null,
    });
  }

  check() {
    checkAnalysis(this);
    for (let attachment of this.attachments) {
      checkAttachment(attachment);
    }
    const fields = new Set(
      this.attachments.map((attachment) => attachment.field),
    );

    if (fields.size !== this.attachments.length) {
      throw new Error(`Several attachments target the same field`);
    }
  }
}

function generateFilename(attachment) {
  // We work with unvalidated data at this point
  // Validation of all properties happens in the `check` method
  const jpathStr = Array.isArray(attachment.jpath)
    ? attachment.jpath.join('/')
    : String(attachment.jpath);
  const filename = String(attachment.filename);
  return `${jpathStr}/${ASCIIFolder.foldReplacing(filename, '_')}`;
}
