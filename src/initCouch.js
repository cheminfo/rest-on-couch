'use strict';

const { getGlobalConfig } = require('./config/config');
const { open } = require('./connect');
const setupAuditActions = require('./init/auditActions');
const loadCouch = require('./util/load');

async function initCouch() {
  const config = getGlobalConfig();
  const nano = await open();
  if (config.auditActions) {
    await setupAuditActions(nano);
  }
  loadCouch();
}

module.exports = initCouch;
