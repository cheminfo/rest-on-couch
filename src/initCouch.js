'use strict';

const config = require('./config/config').globalConfig;
const { open } = require('./connect');
const loadCouch = require('./util/load');
const debug = require('./util/debug')('main:initCouch');
const nanoPromise = require('./util/nanoPromise');

async function initCouch() {
  const nano = await open();
  if (config.auditActions) {
    await setupAuditActions(nano);
  }
  loadCouch();
}

async function setupAuditActions(nano) {
  debug('setup audit actions');
  const auditActionsDb = config.auditActionsDb;
  // Check if database is accessible
  try {
    const dbExists = await nanoPromise.getDatabase(nano, auditActionsDb);
    if (!dbExists) {
      throw new Error(
        `audit actions database does not exist: ${auditActionsDb}`
      );
    }
  } catch (e) {
    debug.error('failed to get audit actions database: %s', auditActionsDb);
    throw e;
  }
}

module.exports = initCouch;
