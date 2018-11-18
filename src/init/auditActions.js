'use strict';

const config = require('../config/config').globalConfig;
const debug = require('../util/debug')('main:initCouch');
const auditDesignDoc = require('../design/audit');

async function setupAuditActions(nano) {
  debug('setup audit actions');
  const auditActionsDb = config.auditActionsDb;
  // Check if database is accessible
  try {
    const dbExists = await nano.hasDatabase(auditActionsDb);
    if (!dbExists) {
      throw new Error(
        `audit actions database does not exist: ${auditActionsDb}`
      );
    }
  } catch (e) {
    debug.error('failed to get audit actions database: %s', auditActionsDb);
    throw e;
  }

  // Check design docs
  const db = nano.useDb(config.auditActionsDb);
  const oldDesignDoc = await db.getDocument('_design/audit');
  if (!oldDesignDoc || oldDesignDoc.version !== auditDesignDoc.version) {
    debug('updating audit design doc');
    const newDesignDoc = Object.assign({}, auditDesignDoc);
    if (oldDesignDoc) {
      newDesignDoc._rev = oldDesignDoc._rev;
    }
    await db.insertDocument(newDesignDoc);
  }
}

module.exports = setupAuditActions;
