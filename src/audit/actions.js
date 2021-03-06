'use strict';

const config = require('../config/config').globalConfig;
const { open } = require('../connect');
const debug = require('../util/debug')('audit:actions');

const auditEnabled = !!config.auditActions;

let _globalNano = null;
let _db = null;

async function ensureNano() {
  const newGlobalNano = await open();
  if (_globalNano !== newGlobalNano) {
    _db = newGlobalNano.useDb(config.auditActionsDb);
  }
  return _db;
}

async function auditAction(action, username, ip, meta) {
  if (!auditEnabled) return;
  debug('logAction', action, username, ip);
  validateString('action', action);
  validateString('username', username);
  validateString('ip', ip);
  const doc = {
    action,
    username,
    ip,
    date: new Date().toISOString(),
  };
  if (meta) {
    doc.meta = meta;
  }
  const db = await ensureNano();
  await db.insertDocument(doc);
}

async function auditLogin(username, success, provider, ctx) {
  if (!auditEnabled) return;
  const action = success ? 'login.success' : 'login.failed';
  await auditAction(action, username, ctx.ip, { provider });
}

function validateString(name, value) {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
}

module.exports = {
  auditAction,
  auditLogin,
};
