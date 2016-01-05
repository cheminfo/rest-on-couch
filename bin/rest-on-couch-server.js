#!/bin/env node
'use strict';

const program = require('commander');
const server = require('./../src/server/server');

program
    .option('-c, --config <path>', 'Configuration file')
    .parse(process.argv);

server.init(program.config);
server.start().then(() => {
    console.log('Server started successfully');
});