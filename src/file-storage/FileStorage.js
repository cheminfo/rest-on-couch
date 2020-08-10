'use strict';

const { extname } = require('path');

const { StorageManager } = require('@slynova/flydrive');

const getConfig = require('../config/config').getConfig;

class FileStorage {
  constructor(db) {
    const config = getConfig(db);
    this.disk = new StorageManager({
      default: 'disk',
      disks: {
        disk: config.fileStorage,
      },
    }).disk('disk');
  }

  put(name, data) {
    const id = uuid();
    const extension = extname(name);
    c;
  }
}

function getPath(name) {
  return;
}

module.exports = { FileStorage };
