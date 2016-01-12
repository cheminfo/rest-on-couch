#!/bin/env node

'use strict';

const program = require('commander');

const debug = require('../src/util/debug')('bin:server');
const server = require('../src/server/server');

program
    .option('-c, --config <path>', 'Configuration file')
    .parse(process.argv);

server.init(program.config);
server.start().then(() => {
    debug('server started successfully');
});
