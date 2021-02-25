#!/usr/bin/env node

'use strict';

const program = require('commander');

const constants = require('../src/constants');
const log = require('../src/couch/log');
const Couch = require('../src/index');
const debug = require('../src/util/debug')('bin:log');

program
  .option('-d, --database <db>', 'Database name')
  .option('-i, --insert <message>', 'Insert a new log entry')
  .option('-l, --level <level>', 'Log level (default: WARN)')
  .option(
    '-e, --epoch <epoch>',
    'Return results from epoch (default: 1 day ago)',
  )
  .option('-w, --watch', 'Watch for new logs')
  .option('-c --config <path>', 'Path to custom config file')
  .parse(process.argv);

const options = program.opts();

const couch = new Couch(options.database);

if (options.insert) {
  couch.log(options.insert, options.level).then(
    function (done) {
      if (done) {
        debug('log inserted successfully');
      } else {
        debug.warn('log ignored by current level');
      }
    },
    function (e) {
      debug.error(e);
    },
  );
} else {
  couch
    .getLogs(parseInt(options.epoch, 10))
    .then(function (logs) {
      for (var i = 0; i < logs.length; i++) {
        write(logs[i]);
      }
      if (options.watch) {
        const feed = couch._db.follow({
          since: 'now',
          include_docs: true,
          filter: `${constants.DESIGN_DOC_NAME}/logs`,
        });
        feed.on('change', function (change) {
          write(change.doc);
        });
        feed.follow();
      }
    })
    .catch(function (e) {
      debug.error(e);
    });
}

function write(doc) {
  process.stdout.write(`${log.format(doc)}\n`);
}
