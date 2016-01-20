'use strict';

const data = require('../data/noRights');
const request = require('../setup').getAgent();

function authenticateAs(username, password) {
    return request.post('/auth/login/couchdb')
        .type('form')
        .send({username, password})
        .then(() => request.get('/auth/session'))
        .then(res => {
            if (!res.body.authenticated) {
                throw new Error(`Could not authenticate on CouchDB as ${username}:${password}`);
            }
        });
}

describe('basic rest-api as anonymous', function () {
    before(data);

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request.get(`/db/test/${entry._id}`)
                .expect(404);
        });
    });

    it('get all entries', function () {
        return request.get('/db/test/_all/entries').expect(200).then(entries => {
            entries = JSON.parse(entries.text);
            entries.should.have.length(0);
        });
    });

});

describe('basic rest-api as a@a.com', function () {
    before(() => {
        return data().then(authenticateAs('b@b.com', '123'));
    });

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request
                .get(`/db/test/${entry._id}`)
                .expect(200);
        });
    });

    it('get all entries', function () {
        return request.get('/db/test/_all/entries').expect(200).then(entries => {
            entries = JSON.parse(entries.text);
            entries.should.have.length(2);
        });
    });

    it('query view', function () {
        return request.get('/db/test/_view/entryById?key=%22A%22')
            .expect(200).then(rows => {
                rows = JSON.parse(rows.text);
                rows.should.have.length(1);
            });
    });
});
