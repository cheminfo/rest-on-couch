'use strict';

const fs = require('fs');
const path = require('path');

const hasOwn = require('has-own');

const die = require('../util/die');
const constants = require('../constants');

const dbConfig = (module.exports = {});
const homeDir = require('./home').homeDir;

if (homeDir) {
  try {
    const databases = fs.readdirSync(homeDir);
    for (const database of databases) {
      if (shouldIgnore(database)) continue;
      const databasePath = path.join(homeDir, database);
      const databaseConfigPath = path.join(databasePath, 'config.js');
      if (fs.statSync(databasePath).isDirectory()) {
        let databaseConfig = {};
        if (fs.existsSync(databaseConfigPath)) {
          // eslint-disable-next-line import/no-dynamic-require
          databaseConfig = require(databaseConfigPath);
          const designDocNames = {};
          databaseConfig.designDocNames = [];
          if (
            databaseConfig.customDesign &&
            databaseConfig.customDesign.views
          ) {
            const views = databaseConfig.customDesign.views;
            for (const key in views) {
              if (hasOwn(key, views)) {
                if (!views[key].designDoc) {
                  views[key].designDoc = constants.CUSTOM_DESIGN_DOC_NAME;
                }
                designDocNames[key] = views[key].designDoc;
              }
            }
          }
          databaseConfig.designDocNames = designDocNames;
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
    const importConfigPath = path.join(importPath, 'import.js');
    if (fs.statSync(importPath).isDirectory()) {
      let importConfig = {};
      if (fs.existsSync(importConfigPath)) {
        // eslint-disable-next-line import/no-dynamic-require
        importConfig = require(importConfigPath);
      }
      if (typeof importConfig === 'function') {
        // New import
        databaseConfig.import[importDir] = importConfig;
      } else {
        // Legacy import
        databaseConfig.import[importDir] = Object.assign(
          {},
          databaseConfig.import[importDir],
          importConfig
        );
      }
    }
  }
}

function shouldIgnore(name) {
  return name === 'node_modules' || name.startsWith('.');
}
