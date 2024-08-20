'use strict';

const Couch = require('../index');

const debug = require('./debug')('util:load');
const getConfiguredDbs = require('./getConfiguredDbs');

async function loadCouch() {
  debug.trace('preload databases that have a configuration file');
  const configuredDbs = await getConfiguredDbs();
  configuredDbs.forEach((db) => Couch.get(db));
}

module.exports = loadCouch;
