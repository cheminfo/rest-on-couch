'use strict';

const fs = require('fs');
const path = require('path');

const hasOwn = require('has-own');
const _ = require('lodash');

const constants = require('../constants');
const die = require('../util/die');

const { getHomeDir, getHomeConfig } = require('./home');

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

function extendConfig(
  finalConfig,
  config,
  viewDesignDocNames,
  indexDesignDocNames,
) {
  const { customDesign = {}, ...otherConfig } = config;

  // Other props include filters, lists and other useful things in design docs
  const { views, indexes, ...otherProps } = customDesign;

  if (!finalConfig.customDesign) {
    finalConfig.customDesign = {};
  }
  if (!finalConfig.customDesign.views) {
    finalConfig.customDesign.views = {};
  }

  if (!finalConfig.customDesign.indexes) {
    finalConfig.customDesign.indexes = {};
  }

  const otherKeys = Object.keys(otherProps);
  for (let key of otherKeys) {
    if (finalConfig.customDesign[key]) {
      throw new Error(`customDesign.${key} cannot be overriden`);
    }
    finalConfig.customDesign[key] = otherProps[key];
  }

  if (views) {
    addCustomViewMap(finalConfig.customDesign.views, viewDesignDocNames, views);
  }
  if (indexes) {
    addCustomIndexMap(
      finalConfig.customDesign.indexes,
      indexDesignDocNames,
      indexes,
    );
  }
  Object.assign(finalConfig, otherConfig);
}

function getDbConfig(homeDir) {
  const dbConfig = {};
  const homeConfig = getHomeConfig(homeDir);
  const databases = fs.readdirSync(homeDir).filter((file) => {
    return fs.statSync(path.join(homeDir, file)).isDirectory();
  });
  for (const database of databases) {
    if (shouldIgnore(database)) continue;
    const configDraft = {};
    const databasePath = path.join(homeDir, database);
    const indexDesignDocNames = {};
    const viewDesignDocNames = {};
    const databaseConfigPath = path.join(databasePath, 'config.js');

    // Extend parent config
    extendConfig(
      configDraft,
      homeConfig,
      viewDesignDocNames,
      indexDesignDocNames,
    );

    if (fs.existsSync(databaseConfigPath)) {
      const dbConfig = require(databaseConfigPath);
      extendConfig(
        configDraft,
        dbConfig,
        viewDesignDocNames,
        indexDesignDocNames,
      );
    }

    const views = configDraft.customDesign.views;
    const indexes = configDraft.customDesign.indexes;

    // Add views from views folder
    addCustomViews(views, viewDesignDocNames, databasePath);

    // Add indexes from indexes folder
    addCustomIndexes(indexes, indexDesignDocNames, databasePath);

    checkDocNames(viewDesignDocNames, indexDesignDocNames);

    configDraft.designDocNames = {
      ...viewDesignDocNames,
      ...indexDesignDocNames,
    };

    if (!configDraft.import) {
      configDraft.import = {};
    }

    readImportConfig(databasePath, configDraft);
    configDraft.database = database;
    dbConfig[database] = configDraft;
  }
  return dbConfig;
}

function checkDocNames(viewDesignDocNames, indexDesignDocNames) {
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
}

function addCustomViewMap(customMap, designDocNames, newCustomMap) {
  const currentKeys = Object.keys(customMap);
  const newKeys = Object.keys(newCustomMap);
  const intersectionKeys = _.intersection(currentKeys, newKeys);
  if (intersectionKeys.length !== 0) {
    throw new Error(`a view is defined more than once: ${intersectionKeys}`);
  }
  for (const key in newCustomMap) {
    if (hasOwn(key, newCustomMap)) {
      if (!newCustomMap[key].designDoc) {
        newCustomMap[key].designDoc = constants.CUSTOM_DESIGN_DOC_NAME;
      }
      designDocNames[key] = newCustomMap[key].designDoc;
    }
  }
  Object.assign(customMap, newCustomMap);
}

function addCustomViews(customMap, designDocNames, databasePath) {
  const viewsFolder = 'views';
  // Get views from views folder
  let customViews;
  try {
    customViews = fs.readdirSync(path.join(databasePath, viewsFolder));
  } catch {
    customViews = [];
  }

  for (let customView of customViews) {
    const viewMap = require(path.join(databasePath, viewsFolder, customView));
    addCustomViewMap(customMap, designDocNames, viewMap);
  }
}

function addCustomIndexMap(customMap, designDocNames, newCustomMap) {
  const currentKeys = Object.keys(customMap);
  const newKeys = Object.keys(newCustomMap);
  const intersectionKeys = _.intersection(currentKeys, newKeys);
  if (intersectionKeys.length !== 0) {
    throw new Error(`an index is defined more than once: ${intersectionKeys}`);
  }
  for (const key in newCustomMap) {
    if (hasOwn(key, newCustomMap)) {
      if (!newCustomMap[key].ddoc) {
        throw new Error('index must have ddoc');
      }
      designDocNames[key] = newCustomMap[key].ddoc;
    }
  }
  Object.assign(customMap, newCustomMap);
}

function addCustomIndexes(customMap, designDocNames, databasePath) {
  const indexesFolder = 'indexes';
  let customIndexes;
  try {
    customIndexes = fs.readdirSync(path.join(databasePath, indexesFolder));
  } catch {
    customIndexes = [];
  }

  for (let customIndex of customIndexes) {
    const indexMap = require(
      path.join(databasePath, indexesFolder, customIndex),
    );
    addCustomIndexMap(customMap, designDocNames, indexMap);
  }
}

function readImportConfig(databasePath, configDraft) {
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
        configDraft.import[importDir] = importConfig;
      } else {
        // Legacy import
        configDraft.import[importDir] = {
          ...configDraft.import[importDir],
          ...importConfig,
        };
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
