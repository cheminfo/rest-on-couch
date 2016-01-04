#!/usr/bin/env node

'use strict';

const program = require('commander');
const config = require('../src/util/config');

const pkg = require('../package.json');
program.version(pkg.version);

program
    .command('import', 'import a file in a database')
    .command('server', 'start a server for the REST API')
    .command('log', 'view logs');

program.command('get <key>').action((key) => {
    let value = config.get(key);
    console.log(value);
});
program.command('set <key> <value>').action(config.set);

program.parse(process.argv);
