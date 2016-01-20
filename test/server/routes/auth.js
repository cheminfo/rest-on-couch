'use strict';

const request = require('../../setup').getAgent();

describe('server/routes/auth', function () {
    describe('session', function () {
        it('should return anonymous for unauthenticated users', function () {
            return request
                .get('/auth/session')
                .expect(200)
                .then(res => {
                    res.body.should.eql({
                        ok: true,
                        authenticated: false,
                        username: 'anonymous'
                    });
                });
        });
    });
});
