#!/bin/env node

'use strict';

const chokidar = require('chokidar');
const exec = require('child_process').exec;
const fs = require('fs-extra');
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
    .option('--wait <time>', 'Wait time in minutes between imports for continuous mode (default: 1)', Number, 1)
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);

let prom = Promise.resolve();
if (program.args[0]) {
    debug(`file argument: ${program.args[0]}`);
    // TODO add 2 arguments: db and import names
    throw new Error('not ready');
    //const file = path.resolve(program.args[0]);
    //
    //prom = prom.then(() => {
    //    return imp.import(config, file);
    //});
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
    debug('continuous');
    const waitTime = program.wait * 60;
    doContinuous(waitTime);
} else {
    debug('no watch');
    prom = prom.then(importAll);
}

function doContinuous(waitTime) {
    importAll().then(
        () => setTimeout(doContinuous, waitTime),
        err => die(err.message || err)
    );
}

function importAll() {
    const homeDir = getHomeDir();
    return findFiles(homeDir)
        .then(paths => {
            const limit = program.limit || paths.length;
            debug(`limit is ${limit}`);
            var i = 0, count = 0;
            var p = Promise.resolve();
            while (count < limit && i < paths.length) {
                let file = checkFile(homeDir, paths[i]);
                if (file) {
                    count++;
                    p = p.then(() => processFile(file.database, file.importName, homeDir, paths[i]));
                }
                i++;
            }
            return p;
        });
}

prom.then(function () {
    debug('finished');
}, function (err) {
    die(err.message || err);
});

function findFiles(homeDir) {
    return new Promise(function (resolve, reject) {
        exec("find . -mindepth 4 -type f -not -regex '.*/\\(processed\\|errored\\|node_modules\\|\\.\\).*'", {
            cwd: homeDir,
            maxBuffer: 10 * 1000 * 1024
        }, function (err, stdout) {
            if (err) return reject(err);
            let paths = stdout.split('\n');
            paths = paths.filter(path => path);
            debug(`findFiles found ${paths.length} files`);
            resolve(paths);
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
            let dir = path.join(parsedPath.dir, '../processed/' + getMonth());
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
            let dir = path.join(parsedPath.dir, '../errored/' + getMonth());
            createDir(dir);
            tryRename(p, path.join(dir, parsedPath.base), resolve, reject);
        });
    });

    return processChain;
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

function getMonth() {
    var now = new Date();
    return now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2);
}
