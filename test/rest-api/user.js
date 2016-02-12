'use strict';

const data = require('../data/data');
const authenticateAs = require('./authenticate');
const request = require('../setup').getAgent();

describe('User REST-api (data, anonymous)', function () {
    before(data);
    it('Should return 404 if anonymous', function () {
        request.get('/db/test/user/_me')
            .expect(404);
    });

    // TODO: save user as anonymous. What status code?
});

describe('User REST-api (data, a@a.com', function () {
    before(() => {
        return data().then(() => authenticateAs(request, 'a@a.com', '123'));
    });

    it('Should get user details', function () {
        return request.get('/db/test/user/_me')
            .expect(200)
            .then(res => {
                res.body.user.should.equal('a@a.com');
                res.body.val.should.equal('a');
            });
    });

    it('Should save user details', function () {
        return request.post('/db/test/user/_me')
            .send({val: 'x'})
            .expect(200)
            .then(res => {
                res.body.rev.should.startWith('2');
                return couch.getUser('a@a.com').then(user => {
                    user.val.should.equal('x');
                });
            });
    });
});
