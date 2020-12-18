#!/usr/bin/env node

'use strict';

const program = require('commander');

const server = require('../src/server/server');
const debug = require('../src/util/debug')('bin:server');

program
  .option('-c --config <path>', 'Path to custom config file')
  .parse(process.argv);

server.start().then(() => {
  debug('server started successfully');
});
