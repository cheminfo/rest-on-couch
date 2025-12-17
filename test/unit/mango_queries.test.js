import { beforeEach, describe, expect, test } from 'vitest';

import anyuser from '../data/anyuser.js';
import noRights from '../data/noRights.js';

import { skipIfCouchV1 } from '../utils/couch.js';

describe('no rights mango queries', () => {
  beforeEach(skipIfCouchV1);
  beforeEach(noRights);
  test('users should get all entries with read access', async () => {
    const data1 = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {},
      },
    });
    expect(data1.docs).toHaveLength(5);

    const data2 = await couch.findEntriesByRight('b@b.com', 'read', {
      query: {
        selector: {},
      },
    });
    expect(data2.docs).toHaveLength(5);
  });

  test('anonymous should get all entries with the defaultAnonymousRead group', async () => {
    const anonymousData = await couch.findEntriesByRight('anonymous', 'read', {
      query: {},
    });

    expect(anonymousData.docs).toHaveLength(2);
    expect(
      anonymousData.docs.every((doc) =>
        doc.$owners.includes('defaultAnonymousRead'),
      ),
    ).toBe(true);
  });

  test('should get owned entries', async () => {
    const dataA = await couch.findEntriesByRight('a@a.com', 'owner', {
      query: {
        selector: {},
      },
    });
    expect(dataA.docs).toHaveLength(1);

    const dataB = await couch.findEntriesByRight('b@b.com', 'owner', {
      query: {
        selector: {},
      },
    });
    expect(dataB.docs).toHaveLength(2);

    const dataX = await couch.findEntriesByRight('x@x.com', 'owner', {
      query: {
        selector: {},
      },
    });
    expect(dataX.docs).toHaveLength(3);
  });

  test('use selector to get specific entry', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {
          '\\$id': {
            $eq: 'entryWithDefaultAnonymousRead',
          },
        },
      },
    });
    expect(data.docs).toHaveLength(1);
    expect(data.warning).toMatch(/No matching index found/);
  });

  test('return field selection', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {
          '\\$content.x': {
            $eq: 3,
          },
        },
        fields: ['\\$content.x'],
      },
    });

    expect(data.docs).toHaveLength(1);
    expect(data.docs).toEqual([{ $content: { x: 3 } }]);
    expect(data.warning).toMatch(
      /No matching index found, create an index to optimize query time/,
    );
  });

  test('filter with mine=true', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        fields: ['\\$content.x'],
      },
      mine: true,
    });

    expect(data.docs).toHaveLength(1);
    expect(data.docs).toStrictEqual([{ $content: { x: 3 } }]);
  });

  test('filter with groups', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      groups: ['groupA'],
      query: {
        fields: ['\\$content.x'],
      },
    });

    expect(data.docs).toHaveLength(1);
    expect(data.docs).toStrictEqual([{ $content: { x: 1 } }]);
  });

  test('use an index', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {
          '\\$content.x': {
            $eq: 3,
          },
        },
        fields: ['\\$content.x'],
        use_index: 'x',
      },
    });

    expect(data.docs).toHaveLength(1);
    expect(data.warning).toBe(undefined);
  });

  test('query with limit', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        limit: 1,
        fields: ['\\$content.x'],
        use_index: 'x',
      },
    });

    expect(data.docs).toHaveLength(1);
  });

  test('query and sorting', async () => {
    const dataAsc = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {
          '\\$content.x': {
            $lte: 3,
          },
        },
        fields: ['\\$content.x'],
        use_index: 'x',
      },
    });
    expect(dataAsc.docs).toHaveLength(2);
    expect(dataAsc.docs[0].$content.x).toBe(1);

    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {
          '\\$content.x': {
            $lte: 3,
          },
        },
        sort: [{ '\\$content.x': 'desc' }],
        fields: ['\\$content.x'],
        use_index: 'x',
      },
    });

    expect(data.docs).toHaveLength(2);
    expect(data.docs[0].$content.x).toBe(3);
  });

  test('use an index which does not exist', async () => {
    return expect(() =>
      couch.findEntriesByRight('a@a.com', 'read', {
        query: {
          selector: {
            '\\$content.x': {
              $eq: 3,
            },
          },
          fields: ['\\$content.x'],
          use_index: 'y',
        },
      }),
    ).rejects.toThrow(/index y does not exist/);
  });
});

test('use sort without index is forbidden', async (context) => {
  skipIfCouchV1(context);
  return expect(() =>
    couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        sort: [{ '\\$content.x': 'desc' }],
      },
    }),
  ).rejects.toThrow(/query with sort must use index/);
});

test('bookmark', async (context) => {
  await skipIfCouchV1(context);
  const data1 = await couch.findEntriesByRight('a@a.com', 'read', {
    query: { limit: 1 },
  });

  expect(data1.docs).toHaveLength(1);
  const data2 = await couch.findEntriesByRight('a@a.com', 'read', {
    query: {
      limit: 1,
      bookmark: data1.bookmark,
    },
  });

  expect(data2.docs).toHaveLength(1);
  expect(data2.docs[0]._id).not.toBe(data1.docs[0]._id);
});

describe('anyuser mango queries', () => {
  beforeEach(skipIfCouchV1);
  beforeEach(anyuser);
  test('should get all entries with any user (global right)', async () => {
    const data = await couch.findEntriesByRight('a@a.com', 'read', {
      query: {
        selector: {},
      },
    });

    expect(data.docs).toHaveLength(2);
  });
});
