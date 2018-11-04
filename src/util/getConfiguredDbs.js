'use strict';

const path = require('path');

const fs = require('fs-extra');

const config = require('../config/config');

const debug = require('./debug')('util:getConfiguredDbs');

let configuredDbs;

async function getConfiguredDbs() {
  if (configuredDbs) return configuredDbs;
  debug.trace('get list of databases that have a configuration file');
  const result = [];
  const homeDir = config.globalConfig.homeDir;
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
  configuredDbs = result;
  return configuredDbs;
}

module.exports = getConfiguredDbs;
