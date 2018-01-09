#!/usr/bin/env node

'use strict';

const program = require('commander');

const debug = require('../src/util/debug')('bin:server');
const server = require('../src/server/server');
require('../src/util/load')();

program
  .option('-c --config <path>', 'Path to custom config file')
  .parse(process.argv);

server.start().then(() => {
  debug('server started successfully');
});
