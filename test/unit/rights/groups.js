import { beforeEach, describe, expect, test } from 'vitest';

import { getDefaultGroupsByRight } from '../../../src/couch/validate.js';
import data from '../../data/data.js';
import noRights from '../../data/noRights.js';

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
      expect(result.sort()).toEqual(['defaultAnonymousRead']);
    });
  });

  test('getDefaultGroupsByRight anonymous', async () => {
    const groups = await getDefaultGroupsByRight(
      global.couch._db,
      'anonymous',
      'read',
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toEqual('defaultAnonymousRead');
  });

  test('getDefaultGroupsByRight anyuser', async () => {
    const groups = await getDefaultGroupsByRight(
      global.couch._db,
      'a@a.com',
      'read',
      true,
    );
    groups.sort();
    expect(groups).toHaveLength(2);
    expect(groups).toEqual(['defaultAnonymousRead', 'defaultAnyuserRead']);
  });

  test('anonymous has no group with owner right', async () => {
    const groups = await global.couch.getGroupsByRight('anonymous', 'owner');
    expect(groups).toHaveLength(0);
  });
});
