import { before, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';

import { auditLogin } from '../../../src/audit/actions.js';
import { getGlobalConfig } from '../../../src/config/config.js';
import { open } from '../../../src/connect.js';
import { resetDatabaseWithoutCouch } from '../../utils/utils.js';

const databaseName = 'test-audit-actions';
let nano;

before(async () => {
  const config = getGlobalConfig();
  config.auditActions = true;
  config.auditActionsDb = databaseName;
  nano = await open();
});

beforeEach(async () => {
  await resetDatabaseWithoutCouch(databaseName);
});

describe('auditLogin', () => {
  it('audits the first successful login', async () => {
    await auditLogin('user@example.com', true, 'couchdb', {
      ip: '127.0.0.1',
    });

    const document = await getAuditDocument('login.success');
    expect(document).toMatchObject({
      action: 'login.success',
      username: 'user@example.com',
      ip: '127.0.0.1',
      meta: { provider: 'couchdb' },
    });
    expect(document.date).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it('audits a failed login', async () => {
    await auditLogin('user@example.com', false, 'ldap', {
      ip: '192.0.2.1',
    });

    const document = await getAuditDocument('login.failed');
    expect(document).toMatchObject({
      action: 'login.failed',
      username: 'user@example.com',
      ip: '192.0.2.1',
      meta: { provider: 'ldap' },
    });
    expect(document.date).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });
});

async function getAuditDocument(action) {
  const response = await nano.request({
    method: 'GET',
    db: databaseName,
    doc: '_all_docs',
    searchParams: { include_docs: true },
  });
  const documents = response.body.rows
    .map((row) => row.doc)
    .filter((document) => document.action === action);
  expect(documents).toHaveLength(1);
  return documents[0];
}
