import { expect } from 'chai';

export function assertMultipleAttachments(entry) {
  expect(entry).toBeDefined();
  expect(entry.$content).toBeDefined();
  expect(entry.$content.spectra.nmr).toHaveLength(1);
  const metadata = entry.$content.spectra.nmr[0];
  expect(metadata).toBeDefined();

  // Automatic fields were added
  expect(typeof metadata.$modificationDate).toBe('number');
  expect(typeof metadata.$creationDate).toBe('number');

  // Metadata was added to the jpath, without a referenced attachment
  expect(metadata).toMatchObject({
    reference: 'test.txt',
    full: { filename: 'spectra/nmr/full.txt' },
    FID: { filename: 'spectra/nmr/FID.txt' },
    FT: { filename: 'spectra/nmr/FT.txt' },
  });

  // No attachments
  expect(Object.keys(entry._attachments)).toHaveLength(3);
  expect(entry._attachments['spectra/nmr/full.txt']).toMatchObject({
    content_type: 'text/plain',
    length: 13,
  });
}

export function assertDefaultAnalysis(entry) {
  expect(entry).toBeDefined();
  expect(entry.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);
  expect(entry.$content).toBeDefined();
  // Check that new content has been merged
  expect(entry.$content.sideEffect).toBe(true);
  expect(entry.$content.jpath).toHaveLength(1);
  const metadata = entry.$content.jpath[0];
  expect(metadata).toBeDefined();

  // Automatic fields were added
  expect(typeof metadata.$modificationDate).toBe('number');
  expect(typeof metadata.$creationDate).toBe('number');

  // Metadata was added to the jpath, without a referenced attachment
  expect(metadata).toMatchObject({
    reference: 'test.txt',
    field: { filename: 'jpath/test.txt' },
    value: 42,
  });

  // No attachments
  expect(Object.keys(entry._attachments)).toHaveLength(1);
  expect(entry._attachments['jpath/test.txt']).toMatchObject({
    content_type: 'text/plain',
    length: 13,
  });
}

export function assertDefaultAnalysisDryRun(result) {
  expect(result).toMatchObject({
    skip: 'dryRun',
    results: [
      {
        id: 'default_analysis',
        kind: 'sample',
        owner: 'a@a.com',
      },
    ],
  });
  expect(result.results).toHaveLength(1);
  const analyses = result.results[0].getAnalyses();
  expect(analyses).toHaveLength(1);
}

export function assertNoAttachment(entry) {
  expect(entry).toBeDefined();
  expect(entry.$owners).toEqual(['a@a.com', 'group1', 'group2', 'group3']);
  expect(entry.$content).toBeDefined();
  // Check that new content has been merged
  expect(entry.$content.sideEffect).toBe(true);
  let metadata = entry.$content.jpath.in.document[0];
  expect(metadata).toBeDefined();

  // Automatic fields were added
  expect(typeof metadata.$modificationDate).toBe('number');
  expect(typeof metadata.$creationDate).toBe('number');

  // Metadata was added to the jpath, without a referenced attachment
  expect(metadata.hasMetadata).toBe(true);
  expect(metadata.field).not.toBeDefined();
  expect(metadata.reference).toBe('test.txt');

  // No attachments
  expect(entry._attachments).not.toBeDefined();
}

export function assertMultipleJpath(entry) {
  expect(entry).toBeDefined();
  expect(entry.$content).toBeDefined();
  expect(entry.$content.jpath.item0).toHaveLength(1);
  expect(entry.$content.jpath.item1).toHaveLength(1);
  const metadata0 = entry.$content.jpath.item0[0];
  const metadata1 = entry.$content.jpath.item1[0];
  expect(metadata0).toBeDefined();
  expect(metadata1).toBeDefined();

  // Automatic fields were added
  expect(typeof metadata0.$modificationDate).toBe('number');
  expect(typeof metadata0.$creationDate).toBe('number');
  expect(typeof metadata1.$modificationDate).toBe('number');
  expect(typeof metadata1.$creationDate).toBe('number');

  // Metadata was added to the jpath, without a referenced attachment
  expect(metadata0).toMatchObject({
    reference: '0_test.txt',
    field0: { filename: 'jpath/item0/0_test.txt' },
    value: 0,
  });
  expect(metadata1).toMatchObject({
    reference: '1_test.txt',
    field1: { filename: 'jpath/item1/1_test.txt' },
    value: 1,
  });

  // No attachments
  expect(Object.keys(entry._attachments)).toHaveLength(2);
  expect(entry._attachments['jpath/item0/0_test.txt']).toMatchObject({
    content_type: 'application/octet-stream',
    length: 5,
  });

  expect(entry._attachments['jpath/item1/1_test.txt']).toMatchObject({
    content_type: 'application/octet-stream',
    length: 6,
  });
}

export function assertUpdateExisting(entry, count) {
  expect(entry).toBeDefined();
  expect(entry.$content).toBeDefined();
  expect(entry.$content.jpath).toHaveLength(1);

  expect(entry.$content).toMatchObject({
    count,
    deep: {
      count,
    },
    jpath: [
      {
        count,
        deep: {
          count,
        },
      },
    ],
  });
}
