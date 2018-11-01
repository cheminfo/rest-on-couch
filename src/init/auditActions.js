'use strict';

const config = require('../config/config').globalConfig;
const debug = require('../util/debug')('main:initCouch');
const nanoPromise = require('../util/nanoPromise');
const auditDesignDoc = require('../design/audit');

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

  // Check design docs
  const db = nano.db.use(config.auditActionsDb);
  const oldDesignDoc = await nanoPromise.getDocument(db, '_design/audit');
  if (!oldDesignDoc || oldDesignDoc.version !== auditDesignDoc.version) {
    debug('updating audit design doc');
    const newDesignDoc = Object.assign({}, auditDesignDoc);
    if (oldDesignDoc) {
      newDesignDoc._rev = oldDesignDoc._rev;
    }
    await nanoPromise.insertDocument(db, newDesignDoc);
  }
}

module.exports = setupAuditActions;
