import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import { getDefaultGroupsByRight } from '../../../src/couch/validate.js';
import data from '../../data/data.js';
import noRights from '../../data/noRights.js';

describe('getGroupsByRight', () => {
  beforeEach(data);
  it('user with create right', () => {
    return global.couch.getGroupsByRight('a@a.com', 'create').then((result) => {
      expect(result.sort()).toEqual(['groupA', 'groupB']);
    });
  });
  it('user without write right', () => {
    return expect(
      global.couch.getGroupsByRight('a@a.com', 'write'),
    ).resolves.toEqual(['groupA']);
  });
  it('user without dummy right', () => {
    return expect(
      global.couch.getGroupsByRight('a@a.com', 'dummy'),
    ).resolves.toEqual([]);
  });
});

describe('getGroupsByRight with default groups', () => {
  beforeEach(noRights);
  it('anonymous has default group', () => {
    return global.couch.getGroupsByRight('anonymous', 'read').then((result) => {
      expect(result.sort()).toEqual(['defaultAnonymousRead']);
    });
  });

  it('getDefaultGroupsByRight anonymous', async () => {
    const groups = await getDefaultGroupsByRight(
      global.couch._db,
      'anonymous',
      'read',
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toEqual('defaultAnonymousRead');
  });

  it('getDefaultGroupsByRight anyuser', async () => {
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

  it('anonymous has no group with owner right', async () => {
    const groups = await global.couch.getGroupsByRight('anonymous', 'owner');
    expect(groups).toHaveLength(0);
  });
});
