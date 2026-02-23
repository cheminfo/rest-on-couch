export class SaveImportError extends Error {
  constructor(message, results) {
    super(message);
    this.results = results;
  }
}
