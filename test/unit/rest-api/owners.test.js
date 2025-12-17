import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

import data from '../../data/data.js';
import { authenticateAs } from '../../utils/authenticate.js';
import { getAgent } from '../../utils/agent.js';

const request = getAgent();

describe('rest api - manage owners', () => {
  const id = 'A';
  beforeEach(() => {
    return data().then(() => authenticateAs(request, 'b@b.com', '123'));
  });
  it('get owners', () => {
    return request
      .get(`/db/test/entry/${id}/_owner`)
      .expect(200)
      .then((result) => {
        expect(result.body).toHaveLength(3);
        expect(result.body[0]).toBe('b@b.com');
      });
  });
  it('add owner', () => {
    return request
      .put(`/db/test/entry/${id}/_owner/test`)
      .expect(200)
      .then(() => couch.getEntry(id, 'b@b.com'))
      .then((entry) => {
        expect(entry.$owners.includes('test')).toBe(true);
      });
  });
  it('remove owner', () => {
    return couch
      .addOwnersToDoc(id, 'b@b.com', 'testRemove', 'entry')
      .then(() => {
        return request
          .del(`/db/test/entry/${id}/_owner/testRemove`)
          .expect(200)
          .then(() => couch.getEntry(id, 'b@b.com'))
          .then((entry) => {
            expect(entry.$owners.includes('testRemove')).toBe(false);
          });
      });
  });
});
