#!/bin/env node

'use strict';

require('commander')
    .version(require('../package.json').version)
    .command('import', 'import a file in a database')
    .command('server', 'start a server for the REST API')
    .command('log', 'view logs')
    .command('conf', 'get/set config parameter')
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);
