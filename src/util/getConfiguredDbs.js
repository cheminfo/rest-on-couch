'use strict';

const path = require('path');

const fs = require('fs-extra');

const { getGlobalConfig } = require('../config/config');

const debug = require('./debug')('util:getConfiguredDbs');

let configuredDbsPromise;

function getConfiguredDbs() {
  if (configuredDbsPromise) return configuredDbsPromise;
  debug.trace('get list of databases that have a configuration file');
  const homeDir = getGlobalConfig().homeDir;

  configuredDbsPromise = readConfiguredDbs(homeDir);
  return configuredDbsPromise;
}

async function readConfiguredDbs(homeDir) {
  const result = [];
  const files = await fs.readdir(homeDir);
  for (const file of files) {
    const stat = await fs.stat(path.join(homeDir, file));
    if (stat.isDirectory()) {
      if (await fs.exists(path.join(homeDir, file, 'config.js'))) {
        debug.trace('found database config file: %s', file);
        result.push(file);
      }
    }
  }
  return result;
}

module.exports = getConfiguredDbs;
