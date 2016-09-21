'use strict';

const fs = require('fs');
const path = require('path');

const debug = require('../util/debug')('config:db');
const die = require('../util/die');

const dbConfig = module.exports = {};
const homeDir = require('./home').homeDir;

if (homeDir) {
    try {
        const databases = fs.readdirSync(homeDir);
        for (const database of databases) {
            if (database === 'node_modules') continue;
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
                            if (views.hasOwnProperty(key)) {
                                if (views[key].designDoc) {
                                    designDocNames[key] = views[key].designDoc;
                                }
                            }
                        }
                    }
                    databaseConfig.designDocNames = designDocNames;
                } catch (e) {
                    // database config is not mandatory
                }
                if (!databaseConfig.import) {
                    databaseConfig.import = {};
                }

                databaseConfig.designDocNames = databaseConfig.designDocNames || {};
                readImportConfig(databasePath, databaseConfig);
                dbConfig[database] = databaseConfig;
            }
        }
    } catch (e) {
        debug.error(e);
        die(`could not read databases from ${homeDir}`);
    }
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
                if (e.code !== 'MODULE_NOT_FOUND') {
                    debug.trace(e.stack || e);
                } else {
                    debug.trace(e);
                }
                continue;
            }
            databaseConfig.import[importDir] = Object.assign({}, databaseConfig.import[importDir], importConfig);
        }
    }
}
