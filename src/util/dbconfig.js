'use strict';

const path = require('path');
const fs = require('fs');
const config = require('./config');
const escapeReg = require('escape-string-regexp');

exports.global = function () {
    try {
        var glob = require(path.join(getHomeDir(), 'config.js'));
    } catch(e) {
        if(e.code !== 'MODULE_NOT_FOUND') throw e;
        glob = {};
    }

    return glob;
};

exports.database = function (dbname) {
    let global = exports.global();
    let homeDir = getHomeDir();
    try {
        var database = require(path.resolve(homeDir, path.join(dbname, 'config.js')));
    } catch(e) {
        if(e.code !== 'MODULE_NOT_FOUND') throw e;
        database = {};
    }
    database.database = dbname;
    return Object.assign({}, global, database);
};


exports.import = function (importFile) {
    let homeDir = getHomeDir();
    let escHomeDir = escapeReg(homeDir);
    if (!escHomeDir.endsWith('/')) {
        escHomeDir += '/';
    }

    importFile = path.resolve(homeDir, importFile);
    let reg = new RegExp(`^(${escHomeDir})([^/]+)/`);
    let match = reg.exec(importFile);
    if (!match) {
        throw new Error(`Invalid import file ${importFile}. Import file should be in ${homeDir}`);
    }

    let database = exports.database(match[2]);
    let imp = require(importFile);
    return Object.assign({}, database, imp);
};


function getHomeDir() {
    let homeDir = config.get('homeDir');
    if (!homeDir) {
        throw new Error('homeDir is not set');
    }
    return homeDir;
}