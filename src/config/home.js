'use strict';

const path = require('path');

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
  try {
    let config = require(path.join(homeDir, 'config'));
    debug('loaded main config file');
    return config;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      debug('no main config found');
      return {};
    }
    throw e;
  }
}

exports.getHomeDir = getHomeDir;
exports.getHomeConfig = getHomeConfig;
