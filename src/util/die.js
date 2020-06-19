'use strict';

/**
 * Prints an optional message and exits the process
 * @param {string} message
 */
module.exports = function (message) {
  if (message) {
    process.stderr.write(`rest-on-couch: ${message}\n`);
  }
  // eslint-disable-next-line no-process-exit
  process.exit(1);
};
