'use strict';

const util = require('util');
const nanoPromise = require('../util/nanoPromise');

const levels = {
    FATAL: 1,
    ERROR: 2,
    WARN: 3,
    INFO: 4,
    DEBUG: 5,
    TRACE: 6
};
const levelNames = ['', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

for (var i in levels) {
    exports[i] = levels[i];
}

const isValidLevel = exports.isValidLevel = function (level) {
    return !!levels[level];
};

function checkLevel(level) {
    if (!isValidLevel(level)) {
        throw new Error(`log level ${level} does not exist`);
    }
}

exports.getLevel = function (level) {
    checkLevel(level);
    return levels[level];
};

exports.log = function (db, currentLevel, message, level) {
    if (typeof currentLevel !== 'number') {
        throw new TypeError('current log level must be a number');
    }
    if (level === undefined) level = 'WARN';
    checkLevel(level);
    level = levels[level];
    if (level > currentLevel) {
        return Promise.resolve();
    }
    return nanoPromise.insertDocument(db, {
        $type: 'log',
        epoch: Date.now(),
        level,
        message
    });
};

const ONE_DAY = 1000 * 60 * 60 * 24;
exports.getLogs = function (db, epoch) {
    if (epoch === undefined) epoch = Date.now() - ONE_DAY;
    return nanoPromise.queryView(db, 'logsByEpoch', {startKey: epoch, include_docs: true}, {onlyDoc: true});
};

exports.format = function (log) {
    const name = levelNames[log.level];
    const date = new Date(log.epoch);
    return `[${date.toISOString()}] [${name}]${' '.repeat(5 - name.length)} ${util.format(log.message)}`;
};
