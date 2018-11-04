'use strict';

const Couch = require('../index');

const debug = require('./debug')('util:load');
const getConfiguredDbs = require('./getConfiguredDbs');

var loaded = false;

async function loadCouch() {
  if (loaded) return;
  debug.trace('preload databases that have a configuration file');
  const configuredDbs = await getConfiguredDbs();
  configuredDbs.forEach((db) => Couch.get(db));
  loaded = true;
}

module.exports = loadCouch;
