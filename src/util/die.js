'use strict';

const EOL = require('os').EOL;

/**
 * Prints an optional message and exits the process
 * @param message
 */
module.exports = function (message) {
    if (message) {
        process.stderr.write('rest-on-couch: ' + message + EOL);
    }
    process.exit(1);
};
