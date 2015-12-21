'use strict';

const server = require('../../src/server/server');
const data = require('../data/noRights');
const supertest = require('supertest-as-promised');

let request = supertest.agent(server.app.callback());

function noop () {}

function authenticateAs(user) {
    return request.post('/_session')
        .type('form')
        .send({name: user, password: '123'})
        .then(noop);
}

describe('basic rest-api as anonymous', function () {
    before(data);
    it('basic', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request.get(`/test/${entry._id}`)
                .expect(404);
        })
    });
});

describe('basic rest-api as a@a.com', function () {
    before(() => {
        return data().then(authenticateAs('b@b.com'))
    });

    it('basic', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request
                .get(`/test/${entry._id}`)
                .expect(200);
        })
    });
});
