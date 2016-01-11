'use strict';

const fs = require('fs');
const path = require('path');

const mainConfigPath =
    process.env.REST_ON_COUCH_CONFIG ||
    path.resolve(require('os').homedir(), '.rest-on-couch-config');

exports.CONFIG_FILE = mainConfigPath;
exports.config = getHomeConfig();

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

exports.get = function (key) {
    return exports.config[key];
};

exports.set = function (key, value) {
    if (!key) {
        throw new Error('key is mandatory');
    }
    const currentConfig = getHomeConfig();
    currentConfig[key] = value;
    fs.writeFileSync(mainConfigPath, JSON.stringify(currentConfig));
    exports.config = currentConfig;
};
