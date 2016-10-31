#!/usr/bin/env node

'use strict';

const program = require('commander');

let debug, server;

if (process.env.REST_ON_COUCH_ASYNC_AWAIT) {
    debug = require('../src/util/debug')('bin:server');
    server = require('../src/server/server');
    require('../src/util/load')();
    debug('starting app with async/await support');
} else {
    debug = require('../lib/util/debug')('bin:server');
    server = require('../lib/server/server');
    require('../lib/util/load');
}

program
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);

server.start().then(() => {
    debug('server started successfully');
});
