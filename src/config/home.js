'use strict';

const path = require('node:path');
const fs = require('node:fs');

const debug = require('../util/debug')('config:home');

function getHomeDir() {
  let homeDir = process.env.REST_ON_COUCH_HOME_DIR;
  if (!homeDir) {
    debug('no home dir');
    return null;
  }
  return path.resolve(homeDir);
}

function getHomeConfig(homeDir) {
  const result = {};
  if (homeDir) {
    homeDir = path.resolve(homeDir);
  } else {
    homeDir = getHomeDir();
  }
  if (!homeDir) {
    debug('no home dir specified');
    return null;
  }

  debug('get home dir config from %s', homeDir);
  result.homeDir = homeDir;
  const files = fs.readdirSync(homeDir);
  const configFile = files.find((file) => /config\.m?js/.exec(file));
  if (configFile) {
    let config = require(path.join(homeDir, configFile));
    debug('loaded main config file');
    return config;
  } else {
    debug(`no config found in home directory ${homeDir}`);
    return {};
  }
}

exports.getHomeDir = getHomeDir;
exports.getHomeConfig = getHomeConfig;
