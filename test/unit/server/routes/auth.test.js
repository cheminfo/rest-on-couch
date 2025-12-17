import { describe, expect, it, test } from 'vitest';

import { getAgent } from '../../../utils/agent.js';

const request = getAgent();

describe('server/routes/auth', () => {
  describe('couchdb login', () => {
    it('should return 401 for wrong login credentials', () => {
      return request
        .post('/auth/login/couchdb')
        .send({
          username: 'bad',
          password: 'robot',
        })
        .expect(401)
        .then((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });
  });
  describe('session', () => {
    test('should return anonymous for unauthenticated users', () => {
      return request
        .get('/auth/session')
        .expect(200)
        .then((res) => {
          expect(res.body).toEqual({
            ok: true,
            authenticated: false,
            username: 'anonymous',
            provider: null,
            admin: false,
          });
        });
    });
  });
});
