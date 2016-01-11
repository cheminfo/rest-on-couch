'use strict';

/**
 * Prints an optional message and exits the process
 * @param message
 */
module.exports = function (message) {
    if (message) {
        console.error(`rest-on-couch: ${message}`);
    }
    process.exit(1);
};
