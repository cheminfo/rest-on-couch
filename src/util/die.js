'use strict';

/**
 * Prints an optional message and exits the process
 * @param message
 */
module.exports = function (message) {
    if (message) {
        process.stderr.write('rest-on-couch: ' + message + '\n');
    }
    process.exit(1);
};
