'use strict';

const server = require('../../src/server/server');
const data = require('../data/noRights');
const supertest = require('supertest-as-promised')(Promise);

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

    it('get uuids', function() {
        // couchdb returns text/plain so you have to parse the response yourself...
        return request.get('/couch-api/_uuids').expect(200)
            .then(res => {
                const uuids = JSON.parse(res.text);
                uuids.should.have.property('uuids')
                uuids.uuids.should.have.length(1);
            });
    });

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request.get(`/couch-api/test/${entry._id}`)
                .expect(404);
        })
    });

});

describe('basic rest-api as a@a.com', function () {
    before(() => {
        return data().then(authenticateAs('b@b.com'))
    });

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request
                .get(`/couch-api/test/${entry._id}`)
                .expect(200);
        })
    });
});
