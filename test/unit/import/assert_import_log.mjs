import { expect } from 'chai';

export async function assertImportLog(couch, data) {
  // check log
  const importLogs = await couch._db.queryView(
    'importsByDate',
    {
      include_docs: true,
    },
    { onlyDoc: true },
  );
  expect(importLogs).toHaveLength(1);
  expect(importLogs[0]).toMatchObject(data);
}

export async function assertImportLogs(couch, data) {
  // check log
  const importLogs = await couch._db.queryView(
    'importsByDate',
    {
      include_docs: true,
    },
    { onlyDoc: true },
  );
  expect(importLogs).toHaveLength(data.length);
  expect(importLogs).toMatchObject(data);
}
