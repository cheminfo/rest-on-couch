'use strict';

const server = require('../../src/server/server');
const data = require('../data/noRights');
const supertest = require('supertest-as-promised')(Promise);

server.init('src/server/config.test.json');

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

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request.get(`/db/test/${entry._id}`)
                .expect(404);
        })
    });

    it('get all entries', function () {
        return request.get(`/db/test/entries/all`).expect(200).then(entries => {
            entries = JSON.parse(entries.text);
            entries.should.have.length(0);
        });
    });

});

describe('basic rest-api as a@a.com', function () {
    before(() => {
        return data().then(authenticateAs('b@b.com'))
    });

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request
                .get(`/db/test/${entry._id}`)
                .expect(200);
        })
    });

    it('get all entries', function () {
        return request.get(`/db/test/entries/all`).expect(200).then(entries => {
            entries = JSON.parse(entries.text);
            entries.should.have.length(2);
        });
    });

    it('query view', function () {
        return request.get(`/db/test/_view/entryById?key=%22A%22`)
            .expect(200).then(rows => {
                rows = JSON.parse(rows.text);
                rows.should.have.length(1);
            });
    })
});
