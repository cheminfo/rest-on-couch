#!/bin/env node

'use strict';

const program = require('commander');
const path = require('path');
const dbconfig = require('../src/util/dbconfig');
const imp = require('../src/import/import');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const config = require('../src/util/config');
const log = require('../src/couch/log');

program
    .usage('<file> <config>')
    .option('-l, --limit <number>', 'Limit of files to import')
    .parse(process.argv);


let prom = Promise.resolve();
if (program.args[0] && program.args[1]) {
    const config = dbconfig.import(program.args[1]);
    const file = path.resolve(program.args[0]);

    prom = prom.then(() => {
        return imp.import(config, file);
    });
} else if(!program.args[0] && !program.args[1]) {
    // import all
    let homeDir = config.get('homeDir');
    if (!homeDir) {
        console.error('homeDir must be set to import all');
        process.exit(1);
    }

    prom = prom.then(() => findFiles(homeDir))
        .then(paths => {
            let p = Promise.resolve();
            const limit = +program.limit || paths.length;
            for(let i=0; i<limit ; i++) {
                let filepath = path.join(homeDir, paths[i].dir, paths[i].base);
                p = p.then(() => {
                    let config = dbconfig.import(path.join(paths[i].dir, 'import.js'));
                    return imp.import(config, filepath);
                }).then(() => {
                    // mv to processed
                    return new Promise(function(resolve, reject) {
                        fs.rename(filepath, path.join(homeDir, paths[i].dir, 'processed', paths[i].base), function(err) {
                            if(err) return reject(err);
                            resolve();
                        });
                    });
                }).catch(() => {
                    // mv to errored
                    return new Promise(function(resolve, reject) {
                        fs.rename(filepath, path.join(homeDir, paths[i].dir, 'errored', paths[i].base), function(err) {
                            if(err) return reject(err);
                            resolve();
                        });
                    });
                });
            }
            return p;
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
        exec('find . -not -path \'*/\.*\' -maxdepth 3 -mindepth 3 -type f', {cwd: homeDir, maxBuffer: 10*1000*1024}, function (err, stdout) {
            let dirs = new Map();
            if(err) return reject(err);
            let paths = stdout.split('\n');
            paths = paths.filter(path => path);
            let parsedPaths = paths.map(path.parse);
            parsedPaths = parsedPaths.filter(parsedPath => parsedPath.base !== 'import.js');
            parsedPaths.forEach(parsedPath => {
                dirs.set(parsedPath.dir, true);
            });

            dirs.forEach((val, key) => {
                fs.mkdirpSync(path.join(homeDir, key, 'processed'));
                fs.mkdirpSync(path.join(homeDir, key, 'errored'));
            });
            resolve(parsedPaths);
        });
    });
}
