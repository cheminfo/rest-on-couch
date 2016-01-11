#!/usr/bin/env node

'use strict';

const program = require('commander');

const pkg = require('../package.json');
program.version(pkg.version);

program
    .command('import', 'import a file in a database')
    .command('server', 'start a server for the REST API')
    .command('log', 'view logs')
    .command('config', 'get/set config parameter');

program.parse(process.argv);
