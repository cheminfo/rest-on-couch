#!/bin/env node

'use strict';

const chokidar = require('chokidar');
const co = require('co');
const fs = require('fs-extra');
const fsp = require('thenify-all')(fs);
const path = require('path');
const program = require('commander');

const debug = require('../lib/util/debug')('bin:import');
const die = require('../lib/util/die');
const home = require('../lib/config/home');
const imp = require('../lib/import/import');

var processChain = Promise.resolve();
const importFiles = {};
const createdDirs = {};

program
    .usage('<file>')
    .option('-l, --limit <number>', 'Limit of files to import', Number)
    .option('-w, --watch', 'Watch files')
    .option('--continuous', 'Continuous mode. When import is finished, wait for some time and then import again')
    .option('--wait <time>', 'Wait time in seconds between imports for continuous mode (default: 60)', Number, 60)
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);

function doContinuous(waitTime) {
    importAll().then(
        () => {
            debug('now waiting');
            setTimeout(() => doContinuous(waitTime), waitTime);
        },
        err => die(err.message || err)
    );
}

const importAll = co.wrap(function*() {
    const homeDir = getHomeDir();
    const files = yield findFiles(homeDir);
    const limit = program.limit || files.length;
    debug(`${files.length} files and limit is ${limit}`);
    const min = Math.min(limit, files.length);
    for (var i = 0; i < min; i++) {
        var file = files[i];
        yield processFile2(file.database, file.importName, file.path);
    }
});

const findFiles = co.wrap(function*(homeDir){
    let files = [];

    const databases = yield fsp.readdir(homeDir);
    for (const database of databases) {
        if (database === 'node_modules') continue;
        const databasePath = path.join(homeDir, database);
        const stat = yield fsp.stat(databasePath);
        if (!stat.isDirectory()) continue;

        const importNames = yield fsp.readdir(databasePath);
        for (const importName of importNames) {
            if (importName === 'node_modules') continue;
            const importNamePath = path.join(databasePath, importName);
            const stat = yield fsp.stat(importNamePath);
            if (!stat.isDirectory()) continue;

            try {
                const importConfigPath = path.join(importNamePath, 'import');
                const importConfig = require(importConfigPath);
                if (importConfig && Array.isArray(importConfig.source)) {
                    for (const source of importConfig.source) {
                        try {
                            const sourcePath = path.resolve(importNamePath, source);
                            const sourceToProcessPath = path.join(sourcePath, 'to_process');
                            const stat = yield fsp.stat(sourceToProcessPath);
                            if (stat.isDirectory()) {
                                const fileList = yield getFilesToProcess(sourceToProcessPath);
                                const objFiles = fileList.map(file => ({database, importName, path: file}));
                                files = files.concat(objFiles);
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                }
            } catch (e) {
                // ignore
            }

            try {
                const toProcessPath = path.join(importNamePath, 'to_process');
                const stat = yield fsp.stat(toProcessPath);
                if (stat.isDirectory()) {
                    const fileList = yield getFilesToProcess(toProcessPath);
                    const objFiles = fileList.map(file => ({database, importName, path: file}));
                    files = files.concat(objFiles);
                }
            } catch (e) {
                // ignore
            }
        }
    }

    return files;
});

function getFilesToProcess(directory) {
    return new Promise((resolve, reject) => {
        const items = [];
        fs.walk(directory)
            .on('data', function (item) {
                if (item.stats.isFile()) {
                    items.push(item.path);
                }
            })
            .on('end', function () {
                resolve(items);
            })
            .on('error', function (error) {
                reject(error);
            });
    });
}

function getHomeDir() {
    let homeDir = home.homeDir;
    if (!homeDir) {
        die('homeDir must be set to import all');
    }
    return homeDir;
}

function checkFile(homeDir, p) {
    p = path.resolve(homeDir, p);
    const relpath = path.relative(homeDir, p);
    const elements = relpath.split('/');
    if (elements.length < 4) return false;
    if (elements[2] !== 'to_process') return false;
    if (hasImportFile(path.resolve(homeDir, elements[0] + '/' + elements[1]))) {
        return {
            database: elements[0],
            importName: elements[1]
        };
    }
}

function processFile(database, importName, homeDir, p) {
    debug.trace(`process file ${p}`);
    p = path.resolve(homeDir, p);
    let parsedPath = path.parse(p);

    processChain = processChain.then(() => {
        return imp.import(database, importName, p);
    }).then(() => {
        // mv to processed
        return new Promise(function (resolve, reject) {
            let dir = path.join(parsedPath.dir, '../processed/' + getDatePath());
            createDir(dir);
            tryRename(p, path.join(dir, parsedPath.base), resolve, reject);
        });
    }).catch(e => {
        // mv to errored
        return new Promise(function (resolve, reject) {
            if (e.message.startsWith('no import config')) {
                debug.warn('no import configuration found, skipping this file');
                return resolve();
            }
            debug.error(e + '\n' + e.stack);
            let dir = path.join(parsedPath.dir, '../errored/' + getDatePath());
            createDir(dir);
            tryRename(p, path.join(dir, parsedPath.base), resolve, reject);
        });
    });

    return processChain;
}

function* processFile2(database, importName, filePath) {
    debug.trace(`process file ${filePath}`);
    const parsedPath = path.parse(filePath);
    const splitParsedPath = parsedPath.dir.split('/');
    const to_process = splitParsedPath.indexOf('to_process');
    if (to_process === -1) {
        throw new Error('to_process not found in path. This should not happen');
    }

    try {
        yield imp.import(database, importName, filePath);
        // success, move to processed
        yield moveFile(filePath, parsedPath.base, splitParsedPath, to_process, 'processed');
    } catch (e) {
        // error, move to errored
        if (e.message.startsWith('no import config')) {
            debug.warn('no import configuration found, skipping this file');
            return;
        }
        debug.error(e + '\n' + e.stack);
        yield moveFile(filePath, parsedPath.base, splitParsedPath, to_process, 'errored');
    }
}

function* moveFile(filePath, fileName, splitParsedPath, to_process, dest) {
    const base = splitParsedPath.slice(0, to_process).join('/');
    let subdir;
    if (splitParsedPath.length - to_process > 1) {
        subdir = splitParsedPath.slice(to_process + 1).join('/');
    } else {
        subdir = getDatePath();
    }
    const destination = path.join(base, dest, subdir, fileName);
    yield tryMove(filePath, destination);
}

function* tryMove(from, to, suffix) {
    if (suffix > 1000) {
        throw new Error('tryMove: too many retries');
    }
    if (!suffix) {
        suffix = 0;
    }
    var newTo = to;
    if (suffix > 0) {
        newTo += '.' + suffix;
    }
    try {
        yield fsp.move(from, newTo);
    } catch (e) {
        if (e.code !== 'EEXIST') {
            throw new Error(`Could could rename ${from} to ${newTo}: ${e}`);
        }
        yield tryMove(from, to, ++suffix);
    }
}

function tryRename(from, to, resolve, reject, suffix) {
    if (!suffix) {
        suffix = 0;
    }
    var newTo = to;
    if (suffix > 0) {
        newTo += '.' + suffix;
    }
    fs.access(newTo, function (err) {
        if (err) {
            if (err.code !== 'ENOENT') {
                debug.error(`Could could rename ${from} to ${newTo}: ${err}`);
                return reject(err);
            } else {
                return fs.rename(from, newTo, function (err) {
                    if (err) return reject(err);
                    resolve();
                });
            }
        }
        // file exists. retry with another name
        return tryRename(from, to, resolve, reject, ++suffix);
    });
}

function hasImportFile(p) {
    if (importFiles[p]) return true;
    const importFile = path.join(p, 'import.js');
    try {
        fs.accessSync(importFile);
        importFiles[p] = true;
        return true;
    } catch (e) {
        return false;
    }
}

function createDir(dir) {
    if (createdDirs[dir]) return;

    fs.mkdirpSync(dir);
    createdDirs[dir] = true;
}

function getDatePath() {
    var now = new Date();
    return now.getUTCFullYear() + '/' + ('0' + (now.getUTCMonth() + 1)).slice(-2) + '/' + ('0' + now.getUTCDate()).slice(-2);
}

if (program.args[0]) {
    debug(`file argument: ${program.args[0]}`);
    // TODO add 2 arguments: db and import names
    throw new Error('not ready');
    //const file = path.resolve(program.args[0]);
    //imp.import(config, file);
} else if (program.watch) {
    // watch files to import
    let homeDir = getHomeDir();
    debug(`watch ${homeDir}`);
    chokidar.watch(homeDir, {
        ignored: /[\/\\](\.|processed|errored|node_modules)/,
        persistent: true
    }).on('all', function (event, p) {
        debug.trace(`watch event: ${event} - ${p}`);
        let file = checkFile(homeDir, p);
        if (event !== 'add' && event !== 'change' || !file) {
            return;
        }
        processFile(file.database, file.importName, homeDir, p);
    });
} else if (program.continuous) {
    const waitTime = program.wait * 1000;
    debug(`continuous import. Wait time is ${program.wait}`);
    doContinuous(waitTime);
} else {
    debug('no watch');
    importAll().then(function () {
        debug('finished');
    }, function (err) {
        die(err.message || err);
    });
}
