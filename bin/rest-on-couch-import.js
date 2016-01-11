#!/bin/env node

'use strict';

const program = require('commander');
const dbconfig = require('../src/util/dbconfig');
const imp = require('../src/import/import');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const config = require('../src/util/config');
const log = require('../src/couch/log');
const chokidar = require('chokidar');
const path = require('path');

var processChain = Promise.resolve();
const importFiles = {};
const createdDirs = {};

program
    .usage('<file> <config>')
    .option('-l, --limit <number>', 'Limit of files to import')
    .option('-w, --watch', 'Watch files')
    .parse(process.argv);


let prom = Promise.resolve();
if (program.args[0] && program.args[1]) {
    const config = dbconfig.import(program.args[1]);
    const file = path.resolve(program.args[0]);

    prom = prom.then(() => {
        return imp.import(config, file);
    });
} else if (!program.args[0] && !program.args[1] && !program.watch) {
    // import all
    let homeDir = getHomeDir();

    prom = prom.then(() => findFiles(homeDir))
        .then(paths => {
            const limit = +program.limit || paths.length;
            var i = 0, count = 0;
            var p = Promise.resolve();
            while(count < limit && i < paths.length) {
                if(checkFile(homeDir, paths[i])) {
                    count++;
                    p = processFile(homeDir, paths[i]);
                }
                i++;
            }
            return p;
        });
} else if (!program.args[0] && !program.args[1] && program.watch) {
    // watch files to import
    let homeDir = getHomeDir();
    chokidar.watch(homeDir, {
        ignored: /[\/\\]\./,
        persistent: true
    }).on('all', function (event, p) {
        if (event !== 'add' && event !== 'change' || !checkFile(homeDir, p)) {
            return;
        }
        processFile(homeDir, p);
    });

} else {
    console.error('Import command should be called either with 2 arguments or with none');
    process.exit(1);
}

prom.catch(function (err) {
    console.error(err.message || err);
    process.exit(1);
});

function findFiles(homeDir) {
    return new Promise(function (resolve, reject) {
        exec('find . -not -path \'*/\.*\' -maxdepth 4 -mindepth 4 -type f', {
            cwd: homeDir,
            maxBuffer: 10 * 1000 * 1024
        }, function (err, stdout) {
            if (err) return reject(err);
            let paths = stdout.split('\n');
            paths = paths.filter(path => path);
            resolve(paths);
        });
    });
}

function getHomeDir() {
    let homeDir = config.get('homeDir');
    if (!homeDir) {
        console.error('homeDir must be set to import all');
        process.exit(1);
    }
    return homeDir;
}

function checkFile(homeDir, p) {
    p = path.resolve(homeDir, p);
    const relpath = path.relative(homeDir, p);
    const elements = relpath.split('/');
    if (elements.length !== 4) return false;
    if(elements[2] !== 'to_process') return false;

    return hasImportFile(p);
}

function processFile(homeDir, p) {
    p = path.resolve(homeDir, p);
    let parsedPath = path.parse(p);

    processChain = processChain.then(() => {
        let config = dbconfig.import(path.join(parsedPath.dir, '../import.js'));
        return imp.import(config, p);
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
    return now.getFullYear() + ("0" + (new Date().getMonth() + 1)).slice(-2);
}