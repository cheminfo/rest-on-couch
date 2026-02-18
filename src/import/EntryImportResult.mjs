import { checkEntry } from './assert.mjs';
import { ImportAnalysis } from './ImportAnalysis.mjs';

export class EntryImportResult {
  content = {};
  id = null;
  kind = null;
  owner = null;
  #isSkipped = false;
  groups = [];
  analyses = [];
  _context;
  constructor(context) {
    this._context = context;
  }

  getContents(encoding) {
    this._context.getContents(encoding);
  }

  get isSkipped() {
    return this.#isSkipped;
  }

  skip() {
    this.#isSkipped = true;
  }

  getAnalyses() {
    return this.analyses;
  }

  addGroup(group) {
    this.groups.push(group);
  }

  addGroups(groups) {
    this.groups = this.groups.concat(groups);
  }

  check() {
    if (this.isSkipped) {
      // Do not check skipped import entries
      return;
    }

    checkEntry(this);
    for (let analysis of this.analyses) {
      analysis.check();
    }
  }

  /**
   * Create an item with a default attachment.
   * @param {import("./ImportListItem.mjs").Analysis & Omit<import("./ImportAnalysis.mjs").AnalysisAttachment, 'contents'>} analysisWithAttachment
   * @returns {ImportAnalysis}
   */
  addDefaultAnalysis(analysisWithAttachment) {
    const { attachment, ...analysisProps } = analysisWithAttachment;
    const newAnalysis = this.addAnalysis(analysisProps);
    if (attachment.contents) {
      throw new Error('Default item uses the import file');
    }
    newAnalysis.addAttachment({
      contents: this._context.getContentsSync(),
      filename: this._context.filename,
      ...attachment,
    });
    return newAnalysis;
  }

  /**
   * Add or update a list item based on its jpath and reference.
   * @param {import("./ImportAnalysis.mjs").Analysis} analysis
   */
  addAnalysis(analysis) {
    const newAnalysis = new ImportAnalysis(analysis);
    this.analyses.push(newAnalysis);
    return newAnalysis;
  }
}
