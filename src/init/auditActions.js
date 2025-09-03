'use strict';

const { getGlobalConfig } = require('../config/config');
const auditDesignDoc = require('../design/audit');
const debug = require('../util/debug')('main:initCouch');

async function setupAuditActions(nano) {
  debug('setup audit actions');
  const config = getGlobalConfig();
  const auditActionsDb = config.auditActionsDb;
  // Check if database is accessible
  try {
    const dbExists = await nano.hasDatabase(auditActionsDb);
    if (!dbExists) {
      throw new Error(
        `audit actions database does not exist: ${auditActionsDb}`,
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
    const newDesignDoc = { ...auditDesignDoc };
    if (oldDesignDoc) {
      newDesignDoc._rev = oldDesignDoc._rev;
    }
    await db.insertDocument(newDesignDoc);
  }
}

module.exports = setupAuditActions;
