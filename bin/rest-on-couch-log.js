#!/bin/env node

'use strict';

const program = require('commander');
const Couch = require('..');
const binutil = require('../src/util/binutil');
const constants = require('../src/constants');
const log = require('../src/couch/log');

program
    .option('-c, --config <path>', 'Configuration file')
    .option('-i, --insert <message>', 'Insert a new log entry')
    .option('-l, --level <level>', 'Log level')
    .option('-w, --watch', 'Watch for new logs')
    .parse(process.argv);

const config = binutil.loadConfig(program);
const couch = new Couch(config);

if (program.insert) {
    couch.log(program.insert, program.level).then(function (done) {
        if (done) {
            console.log('Log successfully inserted');
        } else {
            console.log('Log ignored by current level');
        }
    }, function (e) {
        console.error(e);
    });
} else {
    couch.getLogs().then(function (logs) {
        for (var i = 0; i < logs.length; i++) {
            write(logs[i]);
        }
        if (program.watch) {
            const feed = couch._db.follow({
                since: 'now',
                include_docs: true,
                filter: constants.DESIGN_DOC_NAME + '/logs'
            });
            feed.on('change', function (change) {
                write(change.doc);
            });
            feed.follow();
        }
    }).catch(function (e) {
        console.error(e);
    });
}

function write(doc) {
    process.stdout.write(log.format(doc) + '\n');
}
