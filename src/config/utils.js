'use strict';

const fs = require('node:fs');
const path = require('node:path');
const debug = require('../util/debug')('config:utils');

function loadConfigFileFromDir(dir) {
  const files = fs.readdirSync(dir);
  const configFile = files.find((file) => /config\.m?js/.test(file));
  if (configFile) {
    let config = require(path.join(dir, configFile));
    if (configFile.endsWith('.mjs')) {
      if (!config?.default) {
        debug.warn(
          'ESM config file %s does not have a default export',
          configFile,
        );
        return {};
      }
      return config.default;
    }
    if (!config) {
      debug.warn('config %s file does not export anything', configFile);
      return {};
    }
    return config;
  }
  debug('no config file found in %s', dir);
  return {};
}

module.exports = { loadConfigFileFromDir };
