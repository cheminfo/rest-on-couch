#!/bin/env node
'use strict';
const server = require('./../src/server/server');

server.start().then(() => {
    console.log('Server started successfully');
});