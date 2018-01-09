'use strict';

const path = require('path');
const debug = require('../util/debug')('config:home');

const result = getHomeConfig();

exports.homeDir = result.homeDir;
exports.config = result.config || {};

function getHomeConfig() {
  const result = {};
  let homeDir = process.env.REST_ON_COUCH_HOME_DIR;
  if (!homeDir) {
    debug('no home dir');
    return result;
  }

  homeDir = path.resolve(homeDir);
  debug(`home dir is ${homeDir}`);

  result.homeDir = homeDir;
  try {
    result.config = require(path.join(homeDir, 'config'));
    debug('loaded main config file');
    return result;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      debug('no main config found');
      return result;
    }
    throw e;
  }
}
