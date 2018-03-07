'use strict';

const request = require('../../setup/setup').getAgent();

describe('server/routes/auth', () => {
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
            admin: false
          });
        });
    });
  });
});
