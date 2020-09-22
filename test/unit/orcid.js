'use strict';

const okORCID = require('../../src/util/orcid');

it('test ORCID checksum calculation', () => {
  expect(okORCID('0000-0003-4894-4660')).toBe(true);
  expect(okORCID(undefined)).toBe(false);
  expect(okORCID(39070)).toBe(false);
  expect(okORCID('0000-0003-4894-4661')).toBe(false);
});
