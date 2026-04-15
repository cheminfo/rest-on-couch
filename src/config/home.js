'use strict';

const path = require('node:path');
const { loadConfigFileFromDir } = require('./utils.js');

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
  const config = loadConfigFileFromDir(homeDir);
  debug('loaded home config file');
  return config;
}

exports.getHomeDir = getHomeDir;
exports.getHomeConfig = getHomeConfig;
