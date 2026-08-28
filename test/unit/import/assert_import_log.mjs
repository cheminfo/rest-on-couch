import { expect } from 'chai';

export function getImportLogs(couch) {
  return couch._db.queryView(
    'importsByDate',
    {
      include_docs: true,
    },
    { onlyDoc: true },
  );
}

function assertLog(importLog, expectedImportLog) {
  expect(importLog).toMatchObject(expectedImportLog);
  expect(importLog.data).toStrictEqual(expectedImportLog.data);
}

export async function assertImportLog(couch, expectedImportLog) {
  const importLogs = await getImportLogs(couch);
  expect(importLogs).toHaveLength(1);
  assertLog(importLogs[0], expectedImportLog);
  return importLogs[0];
}

export async function assertImportLogs(couch, expectedImportLogs) {
  const importLogs = await getImportLogs(couch);
  expect(importLogs).toHaveLength(expectedImportLogs.length);
  for (let i = 0; i < expectedImportLogs.length; i++) {
    assertLog(importLogs[i], expectedImportLogs[i]);
  }
  return importLogs;
}
