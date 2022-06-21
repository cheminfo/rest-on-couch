'use strict';

const util = require('util');

const debug = require('../util/debug')('main:log');

const levels = {
  FATAL: 1,
  ERROR: 2,
  WARN: 3,
  INFO: 4,
  DEBUG: 5,
  TRACE: 6,
};
const levelNames = ['', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

for (var i in levels) {
  exports[i] = levels[i];
}

exports.isValidLevel = function (level) {
  return !!levels[level];
};

function checkLevel(level) {
  if (!exports.isValidLevel(level)) {
    throw new Error(`log level ${level} does not exist`);
  }
}

exports.getLevel = function (level) {
  checkLevel(level);
  return levels[level];
};

exports.log = async function (db, currentLevel, message, level) {
  if (typeof currentLevel !== 'number') {
    throw new TypeError('current log level must be a number');
  }
  if (level === undefined) level = 'WARN';
  checkLevel(level);
  level = levels[level];
  if (level > currentLevel) {
    return false;
  }
  await db.insertDocument({
    $type: 'log',
    epoch: Date.now(),
    level,
    message,
  });
  return true;
};

const ONE_DAY = 1000 * 60 * 60 * 24;
exports.getLogs = function (db, epoch) {
  if (epoch === undefined) epoch = Date.now() - ONE_DAY;
  return db.queryView(
    'logsByEpoch',
    { startkey: epoch, include_docs: true },
    { onlyDoc: true },
  );
};

exports.format = function (log) {
  const name = levelNames[log.level];
  const date = new Date(log.epoch);
  return `[${date.toISOString()}] [${name}]${' '.repeat(
    5 - name.length,
  )} ${util.format(log.message)}`;
};

exports.methods = {
  async log(message, level) {
    debug('log (%s, %s)', message, level);
    await this.open();
    return exports.log(this._db, this._logLevel, message, level);
  },

  async getLogs(epoch) {
    debug('getLogs (%s)', epoch);
    await this.open();
    return exports.getLogs(this._db, epoch);
  },
};
