'use strict';

const fs = require('fs');
const hasOwn = require('has-own');
const path = require('path');

const die = require('../util/die');

const dbConfig = module.exports = {};
const homeDir = require('./home').homeDir;

if (homeDir) {
    try {
        const databases = fs.readdirSync(homeDir);
        for (const database of databases) {
            if (shouldIgnore(database)) continue;
            const databasePath = path.join(homeDir, database);
            if (fs.statSync(databasePath).isDirectory()) {
                let databaseConfig = {};
                try {
                    databaseConfig = require(path.join(databasePath, 'config'));
                    var designDocNames = {};
                    databaseConfig.designDocNames = [];
                    if (databaseConfig.customDesign && databaseConfig.customDesign.views) {
                        var views = databaseConfig.customDesign.views;
                        for (var key in views) {
                            if (hasOwn(key, views)) {
                                if (views[key].designDoc) {
                                    designDocNames[key] = views[key].designDoc;
                                }
                            }
                        }
                    }
                    databaseConfig.designDocNames = designDocNames;
                } catch (e) {
                    if (e.code !== 'MODULE_NOT_FOUND') {
                        throw e;
                    }
                }
                if (!databaseConfig.import) {
                    databaseConfig.import = {};
                }

                databaseConfig.designDocNames = databaseConfig.designDocNames || {};
                readImportConfig(databasePath, databaseConfig);
                databaseConfig.database = database;
                dbConfig[database] = databaseConfig;
            }
        }
    } catch (e) {
        console.error(e.stack || e); // eslint-disable-line no-console
        die(`could not read database configurations from ${homeDir}`);
    }
}

function readImportConfig(databasePath, databaseConfig) {
    const imports = fs.readdirSync(databasePath);
    for (const importDir of imports) {
        if (shouldIgnore(importDir)) continue;
        const importPath = path.join(databasePath, importDir);
        if (fs.statSync(importPath).isDirectory()) {
            let importConfig = {};
            try {
                importConfig = require(path.join(importPath, 'import'));
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw e;
                }
                continue;
            }
            databaseConfig.import[importDir] = Object.assign({}, databaseConfig.import[importDir], importConfig);
        }
    }
}

function shouldIgnore(name) {
    return name === 'node_modules' ||
        name.startsWith('.');
}
