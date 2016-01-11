'use strict';

const fs = require('fs');
const path = require('path');

const mainConfigPath =
    process.env.REST_ON_COUCH_CONFIG ||
    path.resolve(require('os').homedir(), '.rest-on-couch-config');

module.exports = getHomeConfig();

function getHomeConfig() {
    try {
        const config = JSON.parse(fs.readFileSync(mainConfigPath, 'utf8'));
        if (config.homeDir) {
            config.homeDir = path.resolve(mainConfigPath, '..', config.homeDir);
        }
        return config;
    } catch (e) {
        return {};
    }
}
