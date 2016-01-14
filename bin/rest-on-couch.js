#!/bin/env node

'use strict';

require('commander')
    .version(require('../package.json').version)
    .command('import', 'import a file in a database')
    .command('server', 'start a server for the REST API')
    .command('log', 'view logs')
    .command('config', 'get/set config parameter')
    .parse(process.argv);
