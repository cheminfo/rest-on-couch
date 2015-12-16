#!/usr/bin/env node

'use strict';

const program = require('commander');

const pkg = require('../package.json');
program.version(pkg.version);

program
    .command('import', 'import a file in a database');

program.parse(process.argv);
