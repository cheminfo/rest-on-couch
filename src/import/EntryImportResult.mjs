import { checkEntry } from './assert.mjs';
import { ImportAnalysis } from './ImportAnalysis.mjs';

export class EntryImportResult {
  content = {};
  id = undefined;
  kind = null;
  owner = null;
  #isSkipped = false;
  groups = [];
  analyses = [];
  _context;
  constructor(context) {
    this._context = context;
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

  /**
   * Check the validity of the entry and all its analyses.
   * Skipped entries are also checked.
   */
  check() {
    checkEntry(this);
    for (let analysis of this.analyses) {
      analysis.check();
    }
  }

  /**
   * Create the default analysis with the original imported attachment.
   * If you need to specify custom attachment contents, use `.addAnalysis().addAttachment()` instead.
   * @param {import("./ImportAnalysis.mjs").Analysis & {attachment: Omit<import("./ImportAnalysis.mjs").AnalysisAttachment, 'contents'>}} analysisWithAttachment
   * @returns {ImportAnalysis}
   */
  addDefaultAnalysis(analysisWithAttachment) {
    const { attachment, ...analysisProps } = analysisWithAttachment;
    const newAnalysis = this.addAnalysis(analysisProps);
    if (attachment.contents) {
      throw new Error(
        'An attachment contents cannot be defined on the default analysis - it uses the original import file',
      );
    }
    newAnalysis.addAttachment({
      contents: this._context.getContentsSync(),
      filename: this._context.filename,
      ...attachment,
    });
    return newAnalysis;
  }

  /**
   * Add or update an analysis based on its jpath and reference.
   * @param {import("./ImportAnalysis.mjs").Analysis} analysis
   */
  addAnalysis(analysis) {
    const newAnalysis = new ImportAnalysis(analysis);
    this.analyses.push(newAnalysis);
    return newAnalysis;
  }
}
