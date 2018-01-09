'use strict';

class CouchError extends Error {
  constructor(message, reason) {
    super(message);
    this.reason = reason || '';
  }
}

module.exports = CouchError;
