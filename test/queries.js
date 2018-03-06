'use strict';

const data = require('./data/data');
const noRights = require('./data/noRights');

describe('Query default data', () => {
  beforeAll(data);
  test('Should query by user id', () => {
    return couch.queryViewByUser('a@a.com', 'entryById').then((rows) => {
      rows.length.should.equal(5);
    });
  });

  test('Should query limiting the size of the response', () => {
    return couch
      .queryViewByUser('a@a.com', 'entryById', { limit: 2 })
      .then((rows) => {
        rows.length.should.equal(2);
      });
  });

  test('Should query by user id with key', () => {
    return couch
      .queryViewByUser('a@a.com', 'entryById', { key: 'A' })
      .then((rows) => {
        rows.length.should.equal(1);
      });
  });
});

describe('Query no rights data', () => {
  beforeAll(noRights);
  test('Should not grant access to all entries', () => {
    return couch.queryViewByUser('a@a.com', 'entryById').then((rows) => {
      rows.length.should.equal(5);
    });
  });
});

describe('Query view with owner (global right)', () => {
  beforeAll(data);
  test('should return all docs with global right', () => {
    return couch.queryEntriesByRight('a@a.com', 'entryIdByRight').then((res) => {
      res = res.map((x) => x.value);
      res
        .sort()
        .should.eql(['A', 'B', 'C', 'anonymousEntry', 'entryWithAttachment']);
    });
  });
});

describe('Query view with owner (group right)', () => {
  beforeAll(noRights);
  test('should return authorized docs for user', () => {
    return couch.queryEntriesByRight('a@a.com', 'entryIdByRight').then((res) => {
      res = res.map((x) => x.value);
      res
        .sort()
        .should.eql([
          'A',
          'entryWithDefaultAnonymousRead',
          'entryWithDefaultAnyuserRead',
          'entryWithDefaultMultiRead',
          'onlyA'
        ]);
    });
  });
  test('should return authorized docs for anonymous', () => {
    return couch
      .queryEntriesByRight('anonymous', 'entryIdByRight')
      .then((res) => {
        res = res.map((x) => x.value);
        res
          .sort()
          .should.eql([
            'entryWithDefaultAnonymousRead',
            'entryWithDefaultMultiRead'
          ]);
      });
  });
});

describe('Query entries filter groups', () => {
  beforeAll(noRights);
  test('should only return entries owned by the user', () => {
    return couch
      .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
        groups: 'a@a.com'
      })
      .then((res) => {
        res.length.should.equal(1);
        res[0].value.should.equal('onlyA');
      });
  });

  test(
    'should only return entries owned by the defaultAnonymousRead group',
    () => {
      return couch
        .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
          groups: ['defaultAnonymousRead']
        })
        .then((res) => {
          res.length.should.equal(2);
          res.sort(sortByValue);
          res[0].value.should.equal('entryWithDefaultAnonymousRead');
          res[1].value.should.equal('entryWithDefaultMultiRead');
        });
    }
  );

  test(
    'should only return entries owned by the defaultAnonymousRead or defaultAnyuserRead groups',
    () => {
      return couch
        .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
          groups: ['defaultAnonymousRead', 'defaultAnyuserRead']
        })
        .then((res) => {
          res.length.should.equal(3);
          res.sort(sortByValue);
          res[0].value.should.equal('entryWithDefaultAnonymousRead');
          res[1].value.should.equal('entryWithDefaultAnyuserRead');
          res[2].value.should.equal('entryWithDefaultMultiRead');
        });
    }
  );

  test(
    'should only return entries owned by the owner by using the "mine" option',
    () => {
      return couch
        .queryEntriesByRight('a@a.com', 'entryIdByRight', null, { mine: 1 })
        .then((res) => {
          res.length.should.equal(1);
          res[0].value.should.equal('onlyA');
        });
    }
  );

  test(
    'should return group entries and owner entries when "groups" and "mine" options are used in combination',
    () => {
      return couch
        .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
          mine: 1,
          groups: 'defaultAnonymousRead'
        })
        .then((res) => {
          res.length.should.equal(3);
        });
    }
  );

  test(
    'should ignore groups in the "groups" option if the user does not belong to it',
    () => {
      return couch
        .queryEntriesByRight('a@a.com', 'entryIdByRight', null, {
          groups: 'x@x.com'
        })
        .then((res) => {
          res.length.should.equal(0);
        });
    }
  );
});

describe('Query view with reduce', () => {
  beforeAll(data);
  test('Should query by user id', () => {
    return couch
      .queryViewByUser('a@a.com', 'testReduce', { reduce: true })
      .then((rows) => {
        // counts the entries
        rows[0].value.should.equal(5);
      });
  });
  test('should fail because emits owners', () => {
    return couch
      .queryViewByUser('a@a.com', 'entryIdByRight', { reduce: true })
      .should.be.rejectedWith(/is a view with owner/);
  });

  test('Should fail because no reduce', () => {
    return couch
      .queryViewByUser('a@a.com', 'globalRight', { reduce: true })
      .should.be.rejectedWith(/invalid for map-only views/);
  });
});

function sortByValue(a, b) {
  if (a.value < b.value) return -1;
  else if (a.value > b.value) return 1;
  return 0;
}
