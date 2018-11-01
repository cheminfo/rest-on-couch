'use strict';

const config = require('./config/config').globalConfig;
const { open } = require('./connect');
const loadCouch = require('./util/load');
const setupAuditActions = require('./init/auditActions');

async function initCouch() {
  const nano = await open();
  if (config.auditActions) {
    await setupAuditActions(nano);
  }
  loadCouch();
}

module.exports = initCouch;
