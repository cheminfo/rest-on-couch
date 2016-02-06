#!/bin/env node

'use strict';

const program = require('commander');

const debug = require('../lib/util/debug')('bin:server');
const server = require('../lib/server/server');

program
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);

server.start().then(() => {
    debug('server started successfully');
});
