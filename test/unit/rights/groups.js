'use strict';

const data = require('../../data/data');
const noRights = require('../../data/noRights');

describe('getGroupsByRight', () => {
  beforeEach(data);
  test('user with create right', () => {
    return global.couch.getGroupsByRight('a@a.com', 'create').then((result) => {
      expect(result.sort()).toEqual(['groupA', 'groupB']);
    });
  });
  test('user without write right', () => {
    return expect(
      global.couch.getGroupsByRight('a@a.com', 'write'),
    ).resolves.toEqual(['groupA']);
  });
  test('user without dummy right', () => {
    return expect(
      global.couch.getGroupsByRight('a@a.com', 'dummy'),
    ).resolves.toEqual([]);
  });
});

describe('getGroupsByRight with default groups', () => {
  beforeEach(noRights);
  test('anonymous has default group', () => {
    return global.couch.getGroupsByRight('anonymous', 'read').then((result) => {
      expect(result.sort()).toEqual([
        'defaultAnonymousRead',
        'inexistantGroup',
      ]);
    });
  });
});
