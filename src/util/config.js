'use strict';

const fs = require('fs');
const debug = require('debug')('config');
const path = require('path');

var configCache;

const CONFIG_FILE = path.join(process.env.HOME, '.rest-on-couch-config');
exports.get = function (key) {
    debug(`get ${key}`);
    if(!configCache) {
        let content = fs.readFileSync(CONFIG_FILE);
        configCache = JSON.parse(content);
    }

    if(key === undefined) {
        return configCache;
    }
    return configCache[key];
};

exports.set = function (key, value) {
    debug(`set ${key} ${value}`);
    if(key === undefined || value === undefined) {
        throw new Error('Invalid arguments');
    }

    try {
        var config = exports.get();
    } catch(e) {
        console.log('error', e.code);
        if(e.code !== 'ENOENT') {
            throw e;
        }
        config = {};
    }
    config[key] = value;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config));
};

exports.CONFIG_FILE = CONFIG_FILE;
