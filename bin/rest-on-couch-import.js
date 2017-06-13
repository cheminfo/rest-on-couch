#!/usr/bin/env node

'use strict';

const chokidar = require('chokidar');
const delay = require('delay');
const fs = require('fs-extra');
const klaw = require('klaw');
const path = require('path');
const program = require('commander');

const connect = require('../src/connect');
const debug = require('../src/util/debug')('bin:import');
const die = require('../src/util/die');
const home = require('../src/config/home');
const imp = require('../src/import/import');
const getConfig = require('../src/config/config').getConfig;
const tryMove = require('../src/util/tryMove');
const fsp = require('fs-extra');

var processChain = Promise.resolve();
const importFiles = {};
const createdDirs = {};

program
    .usage('<file> <database> <kind>')
    .option('-l, --limit <number>', 'Limit of files to import', Number)
    .option('-w, --watch', 'Watch files')
    .option('--continuous', 'Continuous mode. When import is finished, wait for some time and then import again')
    .option('--wait <time>', 'Wait time in seconds between imports for continuous mode (default: 60)', Number, 60)
    .option('--sort <order>', 'Sorting order of the files when to_processed is walked (default: asc)', String, 'asc')
    .option('-c --config <path>', 'Path to custom config file')
    .option('--dry-run', 'Do all the steps without updating the database')
    .parse(process.argv);

if (program.sort !== 'asc' && program.sort !== 'desc') {
    throw new Error('sort order must be "asc" or "desc"');
}
const sortWalk = program.sort === 'asc' ? 'shift' : 'pop';

async function doContinuous(waitTime) {
    while (true) {
        await importAll();
        debug('now waiting');
        await delay(waitTime);
    }
}

async function importAll() {
    const homeDir = getHomeDir();
    const limit = program.limit || 0;
    debug(`limit is ${limit}`);
    const files = await findFiles(homeDir, limit);
    debug(`${files.length} files to import`);
    const dbs = new Set();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        dbs.add(file.database);
        await processFile2(file.database, file.importName, file.path);
    }
    return dbs;
}

async function findFiles(homeDir, limit) {
    let files = [];

    const databases = await fsp.readdir(homeDir);
    for (const database of databases) {
        if (shouldIgnore(database)) continue;
        const databasePath = path.join(homeDir, database);
        const stat = await fsp.stat(databasePath);
        if (!stat.isDirectory()) continue;

        const importNames = await fsp.readdir(databasePath);
        for (const importName of importNames) {
            if (shouldIgnore(importName)) continue;
            const importNamePath = path.join(databasePath, importName);
            const stat = await fsp.stat(importNamePath);
            if (!stat.isDirectory()) continue;

            try {
                const importConfigPath = path.join(importNamePath, 'import');
                const importConfig = require(importConfigPath);
                if (importConfig && Array.isArray(importConfig.source)) {
                    for (const source of importConfig.source) {
                        try {
                            const sourcePath = path.resolve(importNamePath, source);
                            const sourceToProcessPath = path.join(sourcePath, 'to_process');
                            const stat = await fsp.stat(sourceToProcessPath);
                            if (stat.isDirectory()) {
                                const maxElements = limit > 0 ? (limit - files.length) : 0;
                                const fileList = await getFilesToProcess(sourceToProcessPath, maxElements);
                                const objFiles = fileList.map(file => ({database, importName, path: file}));
                                files = files.concat(objFiles);
                                if (limit > 0 && files.length >= limit) {
                                    return files;
                                }
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
                const stat = await fsp.stat(toProcessPath);
                if (stat.isDirectory()) {
                    const maxElements = limit > 0 ? (limit - files.length) : 0;
                    const fileList = await getFilesToProcess(toProcessPath, maxElements);
                    const objFiles = fileList.map(file => ({database, importName, path: file}));
                    files = files.concat(objFiles);
                    if (limit > 0 && files.length >= limit) {
                        return files;
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    }

    return files;
}

function getFilesToProcess(directory, maxElements) {
    return new Promise((resolve, reject) => {
        const items = [];
        const walkStream = klaw(directory, {queueMethod: sortWalk});
        walkStream
            .on('data', function (item) {
                if (item.stats.isFile()) {
                    items.push(item.path);
                    if (maxElements > 0 && items.length >= maxElements) {
                        this.pause();
                        resolve(items);
                    }
                }
            })
            .on('end', () => resolve(items))
            .on('error', function (err) {
                this.close();
                reject(err);
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
    return false;
}

function processFile(database, importName, homeDir, p) {
    debug.trace(`process file ${p}`);
    p = path.resolve(homeDir, p);
    let parsedPath = path.parse(p);

    processChain = processChain.then(() => {
        return imp.import(database, importName, p);
    }).then(() => {
        // mv to processed
        const config = getConfig(database);
        // check if importation should be done without moving files afterwards
        if (config.import[importName].noFileMove) {
            return null;
        }
        return new Promise(function (resolve, reject) {
            let dir = path.join(parsedPath.dir, '../processed/' + getDatePath());
            createDir(dir);
            tryRename(p, path.join(dir, parsedPath.base), resolve, reject);
        });
    }).catch(e => {
        if (e.skip) return false;
        // mv to errored
        return new Promise(function (resolve, reject) {
            if (e.message.startsWith('no import config')) {
                debug.warn('no import configuration found, skipping this file');
                resolve();
                return;
            }
            debug.error(e + '\n' + e.stack);
            let dir = path.join(parsedPath.dir, '../errored/' + getDatePath());
            createDir(dir);
            tryRename(p, path.join(dir, parsedPath.base), resolve, reject);
        });
    });

    return processChain;
}

async function processFile2(database, importName, filePath) {
    debug.trace(`process file ${filePath}`);
    const parsedPath = path.parse(filePath);
    const splitParsedPath = parsedPath.dir.split('/');
    const toProcess = splitParsedPath.indexOf('to_process');
    if (toProcess === -1) {
        throw new Error('to_process not found in path. This should not happen');
    }

    try {
        await imp.import(database, importName, filePath);
        // success, move to processed
        await moveFile(filePath, parsedPath.base, splitParsedPath, toProcess, 'processed');
    } catch (e) {
        if (e.skip) return;
        // error, move to errored
        if (e.message.startsWith('no import config')) {
            debug.warn('no import configuration found, skipping this file');
            return;
        }
        debug.error(e + '\n' + e.stack);
        await moveFile(filePath, parsedPath.base, splitParsedPath, toProcess, 'errored');
    }
}

async function moveFile(filePath, fileName, splitParsedPath, toProcess, dest) {
    const base = splitParsedPath.slice(0, toProcess).join('/');
    let subdir;
    if (splitParsedPath.length - toProcess > 1) {
        subdir = splitParsedPath.slice(toProcess + 1).join('/');
    } else {
        subdir = getDatePath();
    }
    const destination = path.join(base, dest, subdir, fileName);
    await tryMove(filePath, destination);
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
                    if (err) reject(err);
                    else resolve();
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
    const now = new Date();
    return now.getUTCFullYear() + '/' + ('0' + (now.getUTCMonth() + 1)).slice(-2) + '/' + ('0' + now.getUTCDate()).slice(-2);
}

function shouldIgnore(name) {
    return name === 'node_modules' ||
        name.startsWith('.');
}

(async () => {
    if (program.args[0]) {
        if (program.args.length !== 3) {
            program.help();
        }
        debug(`Import with arguments: ${program.args.join(' ')}`);
        const file = path.resolve(program.args[0]);
        const database = program.args[1];
        const kind = program.args[2];
        await imp.import(database, kind, file, {dryRun: program.dryRun});
        debug('Imported successfully');
    } else if (program.watch) {
        // watch files to import
        let homeDir = getHomeDir();
        debug(`watch ${homeDir}`);
        chokidar.watch(homeDir, {
            ignored: /[/\\](\.|processed|errored|node_modules)/,
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
        await doContinuous(waitTime);
    } else {
        debug('no watch');
        await importAll();
        debug('finished');
    }
})().then(() => connect.close()).catch((err) => {
    connect.close();
    die(err.message || err);
});
