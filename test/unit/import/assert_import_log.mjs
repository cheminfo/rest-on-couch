import { expect } from 'chai';

export async function assertImportLog(couch, data) {
  // check log
  const importLogs = await couch._db.queryView(
    'importsByDate',
    {
      descending: true,
      include_docs: true,
    },
    { onlyDoc: true },
  );
  expect(importLogs).toHaveLength(1);
  expect(importLogs[0]).toMatchObject(data);
}
