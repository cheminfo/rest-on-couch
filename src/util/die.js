'use strict';

/**
 * Prints an optional message and exits the process
 * @param {string} message
 */
module.exports = function die(message) {
  if (message) {
    process.stderr.write(`rest-on-couch: ${message}\n`);
  }
  process.exit(1);
};
