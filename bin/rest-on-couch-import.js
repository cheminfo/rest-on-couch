#!/bin/env node

'use strict';

const program = require('commander');
const path = require('path');
const dbconfig = require('../src/util/dbconfig');
const imp = require('../src/import/import');

program
    .usage('[options] <file>')
    .option('-c, --config <path>', 'Configuration file')
    .parse(process.argv);

if (!program.args.length) {
    throw new Error('you must provide a file argument');
}

const config = dbconfig.import(program.config);
const file = path.resolve(program.args[0]);

imp.import(config, file).catch(function (err) {
    console.error(err.message || err);
    process.exit(1);
});