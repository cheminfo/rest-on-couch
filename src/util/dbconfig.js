'use strict';

const path = require('path');
const fs = require('fs');
const config = require('./config');
const escapeReg = require('escape-string-regexp');

exports.global = function () {
    return require(path.join(getHomeDir(), 'config.js'));
};

exports.database = function (dbname) {
    let global = exports.global();
    let homeDir = getHomeDir();
    let database = require(path.resolve(homeDir, path.join(dbname, 'config.js')));
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
        throw new Error(`Invalid import file. Import file should be in ${homeDir}`);
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