'use strict';

const anyuser = require('../data/anyuser');
const noRights = require('../data/noRights');

describe('no rights mango queries', () => {
  beforeEach(noRights);
  test('should get all entries with read access', async () => {
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

describe('anyuser mango queries', () => {
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
