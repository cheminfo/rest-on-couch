/**
 * Error that import scripts can throw to make the import fail while explicitly
 * recording custom data in the import log entry.
 */
export class ImportError extends Error {
  name = 'ImportError';

  /**
   * @param {string} message
   * @param {object} [options]
   * @param {Record<string, unknown>} [options.importLogData] - Custom data to
   * save in the `data` property of the import log entry. It must be a plain
   * JSON-serializable object.
   * @param {unknown} [options.cause]
   */
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.importLogData = options.importLogData;
  }
}
