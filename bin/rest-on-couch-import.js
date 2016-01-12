#!/bin/env node

'use strict';

const chokidar = require('chokidar');
const exec = require('child_process').exec;
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');

const debug = require('../src/util/debug')('bin:import');
const die = require('../src/util/die');
const home = require('../src/config/home');
const imp = require('../src/import/import');

var processChain = Promise.resolve();
const importFiles = {};
const createdDirs = {};

program
    .usage('<file>')
    .option('-l, --limit <number>', 'Limit of files to import')
    .option('-w, --watch', 'Watch files')
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
} else if (!program.watch) {
    debug('no watch');
    // import all
    let homeDir = getHomeDir();

    prom = prom.then(() => findFiles(homeDir))
        .then(paths => {
            const limit = +program.limit || paths.length;
            debug(`limit is ${limit}`);
            var i = 0, count = 0;
            var p = Promise.resolve();
            while(count < limit && i < paths.length) {
                let file = checkFile(homeDir, paths[i]);
                if(file) {
                    count++;
                    p = processFile(file.database, file.importName, homeDir, paths[i]);
                }
                i++;
            }
            return p;
        });
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
} else {
    die('UNREACHABLE');
}

prom.catch(function (err) {
    die(err.message || err);
});

function findFiles(homeDir) {
    return new Promise(function (resolve, reject) {
        exec("find . -maxdepth 4 -mindepth 4 -type f -not -regex '.*/\\(processed\\|errored\\|node_modules\\|\\.\\).*'", {
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
    let homeDir = home.get('homeDir');
    if (!homeDir) {
        die('homeDir must be set to import all');
    }
    return homeDir;
}

function checkFile(homeDir, p) {
    p = path.resolve(homeDir, p);
    const relpath = path.relative(homeDir, p);
    const elements = relpath.split('/');
    if (elements.length !== 4) return false;
    if(elements[2] !== 'to_process') return false;

    if (hasImportFile(p)) {
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
            fs.rename(p, path.join(dir, parsedPath.base), function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }).catch(() => {
        // mv to errored
        return new Promise(function (resolve, reject) {
            let dir = path.join(parsedPath.dir, '../errored/' + getMonth());
            createDir(dir);
            fs.rename(p, path.join(dir, parsedPath.base), function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    });

    return processChain;
}

function hasImportFile(p) {
    const importFile = path.resolve(p, '../../import.js');
    if(importFiles[p]) return true;

    try {
        fs.accessSync(importFile);
        return true;
    } catch (e) {
        return false;
    }
}

function createDir(dir) {
    if(createdDirs[dir]) return;

    fs.mkdirpSync(dir);
    createdDirs[dir] = true;
}

function getMonth() {
    var now = new Date();
    return now.getFullYear() + ('0' + (new Date().getMonth() + 1)).slice(-2);
}
