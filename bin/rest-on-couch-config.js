#!/bin/env node

'use strict';

const program = require('commander');

const config = require('../lib/config/home');
const debug = require('../lib/util/debug')('bin:config');

program.usage('<key>[=<value>]');
program.parse(process.argv);

if (!program.args.length || !program.args[0]) {
    throw new Error('Invalid arguments');
}

let cmd = program.args[0].split('=');

if (cmd.length === 1) {
    process.stdout.write(config.get(cmd[0]) + '\n');
} else {
    config.set(cmd[0], cmd[1]);
    debug(`successfully set ${cmd[0]} to ${cmd[1]} in ${config.CONFIG_FILE}`);
}
