/* eslint-disable import/no-dynamic-require */

'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
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
          databaseConfig = require(databaseConfigPath);
          const designDocNames = {};
          databaseConfig.designDocNames = [];
          databaseConfig.customDesign = databaseConfig.customDesign || {};
          databaseConfig.customDesign.views =
            databaseConfig.customDesign.views || {};
          const views = databaseConfig.customDesign.views;

          // Get views from views folder
          let viewFiles;
          try {
            viewFiles = fs.readdirSync(path.join(databasePath, 'views'));
          } catch (e) {
            viewFiles = [];
          }

          for (let view of viewFiles) {
            const v = require(path.join(databasePath, 'views', view));
            const currentKeys = Object.keys(views);
            const newKeys = Object.keys(v);
            const intersectionKeys = _.intersection(currentKeys, newKeys);
            if (intersectionKeys.length !== 0) {
              throw new Error(
                `a view is defined more than once: ${intersectionKeys}`
              );
            }
            Object.assign(views, v);
          }
          for (const key in views) {
            if (hasOwn(key, views)) {
              if (!views[key].designDoc) {
                views[key].designDoc = constants.CUSTOM_DESIGN_DOC_NAME;
              }
              designDocNames[key] = views[key].designDoc;
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
    die(`could not read database configurations from ${homeDir}, ${e.message}`);
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
