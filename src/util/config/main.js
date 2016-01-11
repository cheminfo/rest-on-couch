'use strict';

const fs = require('fs');
const path = require('path');

const mainConfigPath =
    process.env.REST_ON_COUCH_CONFIG ||
    path.resolve(require('os').homedir(), '.rest-on-couch-config');

module.exports = getMainConfig();

function getMainConfig() {
    try {
        const data = fs.readFileSync(mainConfigPath);
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}
