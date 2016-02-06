#!/bin/env node

'use strict';

const program = require('commander');

const constants = require('../lib/constants');
const Couch = require('../lib/index');
const debug = require('../lib/util/debug')('bin:log');
const log = require('../lib/couch/log');

program
    .option('-d, --database <db>', 'Database name')
    .option('-i, --insert <message>', 'Insert a new log entry')
    .option('-l, --level <level>', 'Log level (default: WARN)')
    .option('-e, --epoch <epoch>', 'Return results from epoch (default: 1 day ago)')
    .option('-w, --watch', 'Watch for new logs')
    .option('-c --config <path>', 'Path to custom config file')
    .parse(process.argv);

const couch = new Couch(program.database);

if (program.insert) {
    couch.log(program.insert, program.level).then(function (done) {
        if (done) {
            debug('log inserted successfully');
        } else {
            debug.warn('log ignored by current level');
        }
    }, function (e) {
        debug.error(e);
    });
} else {
    couch.getLogs(parseInt(program.epoch)).then(function (logs) {
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
        debug.error(e);
    });
}

function write(doc) {
    process.stdout.write(log.format(doc) + '\n');
}
