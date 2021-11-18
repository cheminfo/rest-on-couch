'use strict';

const data = require('../data/data');
const noRights = require('../data/noRights');

describe('Query default data', () => {
  beforeEach(data);
  test('Should query by user id', () => {
    return couch.queryViewByUser('a@a.com', 'entryById').then((rows) => {
      expect(rows.length).toBe(5);
    });
  });

  test('Should query limiting the size of the response', () => {
    return couch
      .queryViewByUser('a@a.com', 'entryById', { limit: 2 })
      .then((rows) => {
        expect(rows.length).toBe(2);
      });
  });

  test('Should query by user id with key', () => {
    return couch
      .queryViewByUser('a@a.com', 'entryById', { key: 'A' })
      .then((rows) => {
        expect(rows.length).toBe(1);
      });
  });
});

describe('Query no rights data', () => {
  beforeEach(noRights);
  test('Should not grant access to all entries', () => {
    return couch.queryViewByUser('a@a.com', 'entryById').then((rows) => {
      expect(rows.length).toBe(5);
    });
  });
});

describe('Query view with owner (global right)', () => {
  beforeEach(data);
  test('should return all docs with global right', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight')
      .then((res) => {
        res = res.map((x) => x.value);
        expect(res.sort()).toEqual([
          'A',
          'B',
          'C',
          'anonymousEntry',
          'entryWithAttachment',
        ]);
      });
  });
});

describe('Query view with owner (group right)', () => {
  beforeEach(noRights);
  test('should return authorized docs for user', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight')
      .then((res) => {
        res = res.map((x) => x.value);
        expect(res.sort()).toEqual([
          'A',
          'entryWithDefaultAnonymousRead',
          'entryWithDefaultAnyuserRead',
          'entryWithDefaultMultiRead',
          'onlyA',
        ]);
      });
  });
  test('should return authorized docs for anonymous', () => {
    return couch
      .queryEntriesByRight('anonymous', 'entryIdByRight')
      .then((res) => {
        res = res.map((x) => x.value);
        expect(res.sort()).toEqual([
          'entryWithDefaultAnonymousRead',
          'entryWithDefaultMultiRead',
        ]);
      });
  });
});

describe('Query entries filter groups', () => {
  beforeEach(noRights);
  test('should only return entries owned by the user', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        groups: 'a@a.com',
      })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].value).toBe('onlyA');
      });
  });

  test('should only return entries owned by the defaultAnonymousRead group', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        groups: ['defaultAnonymousRead'],
      })
      .then((res) => {
        expect(res.length).toBe(2);
        res.sort(sortByValue);
        expect(res[0].value).toBe('entryWithDefaultAnonymousRead');
        expect(res[1].value).toBe('entryWithDefaultMultiRead');
      });
  });

  test('should only return entries owned by the defaultAnonymousRead or defaultAnyuserRead groups', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        groups: ['defaultAnonymousRead', 'defaultAnyuserRead'],
      })
      .then((res) => {
        expect(res.length).toBe(3);
        res.sort(sortByValue);
        expect(res[0].value).toBe('entryWithDefaultAnonymousRead');
        expect(res[1].value).toBe('entryWithDefaultAnyuserRead');
        expect(res[2].value).toBe('entryWithDefaultMultiRead');
      });
  });

  test('should only return entries owned by the owner by using the "mine" option', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, { mine: 1 })
      .then((res) => {
        expect(res.length).toBe(1);
        expect(res[0].value).toBe('onlyA');
      });
  });

  test('should return group entries and owner entries when "groups" and "mine" options are used in combination', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        mine: 1,
        groups: 'defaultAnonymousRead',
      })
      .then((res) => {
        expect(res.length).toBe(3);
      });
  });

  test('should ignore groups in the "groups" option if the user does not belong to it', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        groups: 'x@x.com',
      })
      .then((res) => {
        expect(res.length).toBe(0);
      });
  });
});

describe('Query view with reduce', () => {
  beforeEach(data);
  test('Should query by user id', () => {
    return couch
      .queryViewByUser('a@a.com', 'testReduce', { reduce: true })
      .then((rows) => {
        // counts the entries
        expect(rows[0].value).toBe(5);
      });
  });
  test('should fail because emits owners', () => {
    return expect(
      couch.queryViewByUser('a@a.com', 'entryIdByRight', { reduce: true }),
    ).rejects.toThrow(/is a view with owner/);
  });

  test('Should fail because no reduce', () => {
    return expect(
      couch.queryViewByUser('a@a.com', 'globalRight', { reduce: true }),
    ).rejects.toThrow(/invalid for map-only views/);
  });
});

function sortByValue(a, b) {
  if (a.value < b.value) return -1;
  else if (a.value > b.value) return 1;
  return 0;
}
