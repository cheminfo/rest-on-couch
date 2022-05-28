'use strict';

const fs = require('fs');
const path = require('path');

const hasOwn = require('has-own');
const _ = require('lodash');

const constants = require('../constants');
const die = require('../util/die');

const { getHomeDir } = require('./home');

function getDbConfigOrDie(homeDir) {
  if (!homeDir) {
    homeDir = getHomeDir();
  }
  if (homeDir) {
    try {
      return getDbConfig(homeDir);
    } catch (e) {
      die(
        `could not read database configurations from ${homeDir}\n${
          e.stack || e
        }`,
      );
    }
  }
  return null;
}

function getDbConfig(homeDir) {
  const dbConfig = {};
  const databases = fs.readdirSync(homeDir);
  for (const database of databases) {
    if (shouldIgnore(database)) continue;
    const databasePath = path.join(homeDir, database);
    const databaseConfigPath = path.join(databasePath, 'config.js');
    if (fs.statSync(databasePath).isDirectory()) {
      let databaseConfig = {};
      if (fs.existsSync(databaseConfigPath)) {
        databaseConfig = require(databaseConfigPath);
        databaseConfig.designDocNames = [];
        databaseConfig.customDesign = databaseConfig.customDesign || {};
        databaseConfig.customDesign.views =
          databaseConfig.customDesign.views || {};
        databaseConfig.customDesign.indexes =
          databaseConfig.customDesign.indexes || {};
        const views = databaseConfig.customDesign.views;
        const indexes = databaseConfig.customDesign.indexes;

        const indexDesignDocNames = {};
        const viewDesignDocNames = {};
        // Add views from views folder
        addCustomViews(views, viewDesignDocNames, databasePath);

        // Add indexes from indexes folder
        addCustomIndexes(indexes, indexDesignDocNames, databasePath);

        const sharedDesignDocNames = _.intersection(
          Object.values(indexDesignDocNames),
          Object.values(viewDesignDocNames),
        );
        const allKeys = [
          ...Object.keys(indexDesignDocNames),
          ...Object.keys(viewDesignDocNames),
        ];
        const uniqueKeys = new Set(allKeys);
        if (sharedDesignDocNames.length > 0) {
          throw new Error(
            `query indexes and javascript views cannot share design documents: ${sharedDesignDocNames.join(
              ', ',
            )}`,
          );
        }

        if (uniqueKeys.size !== allKeys.length) {
          const sharedKeys = [];
          for (let key of uniqueKeys) {
            if (indexDesignDocNames[key] && viewDesignDocNames[key]) {
              sharedKeys.push(key);
            }
          }
          throw new Error(
            `query indexes and javascript views cannot share names: ${sharedKeys.join(
              ', ',
            )}`,
          );
        }

        databaseConfig.designDocNames = Object.assign(
          {},
          viewDesignDocNames,
          indexDesignDocNames,
        );
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
  return dbConfig;
}

function addCustomViews(customMap, designDocNames, databasePath) {
  const viewsFolder = 'views';
  // Get views from views folder
  let customViews;
  try {
    customViews = fs.readdirSync(path.join(databasePath, viewsFolder));
  } catch (e) {
    customViews = [];
  }

  for (let customView of customViews) {
    const d = require(path.join(databasePath, viewsFolder, customView));
    const currentKeys = Object.keys(customMap);
    const newKeys = Object.keys(d);
    const intersectionKeys = _.intersection(currentKeys, newKeys);
    if (intersectionKeys.length !== 0) {
      throw new Error(`a view is defined more than once: ${intersectionKeys}`);
    }
    Object.assign(customMap, d);
  }
  for (const key in customMap) {
    if (hasOwn(key, customMap)) {
      if (!customMap[key].designDoc) {
        customMap[key].designDoc = constants.CUSTOM_DESIGN_DOC_NAME;
      }
      designDocNames[key] = customMap[key].designDoc;
    }
  }
}

function addCustomIndexes(customMap, designDocNames, databasePath) {
  const indexesFolder = 'indexes';
  let customIndexes;
  try {
    customIndexes = fs.readdirSync(path.join(databasePath, indexesFolder));
  } catch (e) {
    customIndexes = [];
  }

  for (let customIndex of customIndexes) {
    const d = require(path.join(databasePath, indexesFolder, customIndex));
    const currentKeys = Object.keys(customMap);
    const newKeys = Object.keys(d);
    const intersectionKeys = _.intersection(currentKeys, newKeys);
    if (intersectionKeys.length !== 0) {
      throw new Error(
        `an index is defined more than once: ${intersectionKeys}`,
      );
    }
    Object.assign(customMap, d);
  }
  for (const key in customMap) {
    if (hasOwn(key, customMap)) {
      if (!customMap[key].ddoc) {
        throw new Error('index must have ddoc');
      }
      designDocNames[key] = customMap[key].ddoc;
    }
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
          importConfig,
        );
      }
    }
  }
}

function shouldIgnore(name) {
  return name === 'node_modules' || name.startsWith('.');
}

module.exports = {
  getDbConfig,
  getDbConfigOrDie,
};
