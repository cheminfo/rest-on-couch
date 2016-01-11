'use strict';

const fs = require('fs');
const path = require('path');
const die = require('../die');

const dbConfig = module.exports = {};
const homeDir = require('./main').homeDir;

if (!homeDir) {
    return;
}

try {
    const databases = fs.readdirSync(homeDir);
    for (const database of databases) {
        const databasePath = path.join(homeDir, database);
        if (fs.statSync(databasePath).isDirectory()) {
            let databaseConfig = {};
            try {
                databaseConfig = require(path.join(databasePath, 'config'));
            } catch (e) {}
            if (!databaseConfig.import) {
                databaseConfig.import = {};
            }
            readImportConfig(databasePath, databaseConfig);
            dbConfig[database] = databaseConfig;
        }
    }
} catch (e) {
    console.error(e);
    die(`could not read databases from ${homeDir}`);
}

function readImportConfig(databasePath, databaseConfig) {
    const imports = fs.readdirSync(databasePath);
    for (const importDir of imports) {
        const importPath = path.join(databasePath, importDir);
        if (fs.statSync(importPath).isDirectory()) {
            let importConfig = {};
            try {
                importConfig = require(path.join(importPath, 'import'));
            } catch (e) {
                continue;
            }
            databaseConfig.import[importDir] = Object.assign({}, databaseConfig.import[importDir], importConfig);
        }
    }
}
