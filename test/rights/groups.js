'use strict';

const data = require('../data/data');
const noRights = require('../data/noRights');

describe('getGroupsByRight', () => {
  beforeAll(data);
  test('user with create right', () => {
    return global.couch.getGroupsByRight('a@a.com', 'create').then((result) => {
      result.sort().should.eql(['groupA', 'groupB']);
    });
  });
  test('user without write right', () => {
    return global.couch
      .getGroupsByRight('a@a.com', 'write')
      .should.eventually.eql(['groupA']);
  });
  test('user without dummy right', () => {
    return global.couch
      .getGroupsByRight('a@a.com', 'dummy')
      .should.eventually.eql([]);
  });
});

describe('getGroupsByRight with default groups', () => {
  beforeAll(noRights);
  test('anonymous has default group', () => {
    return global.couch.getGroupsByRight('anonymous', 'read').then((result) => {
      result.sort().should.eql(['defaultAnonymousRead', 'inexistantGroup']);
    });
  });
});
