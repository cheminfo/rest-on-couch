#!/bin/env node

'use strict';

const program = require('commander');

const debug = require('../src/util/debug')('bin:server');
const server = require('../src/server/server');

program
    .parse(process.argv);

server.init();
server.start().then(() => {
    debug('server started successfully');
});
