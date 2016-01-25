'use strict';

const request = require('../setup').getAgent();
const noRights = require('../data/noRights');
const data = require('../data/data');

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
    before(noRights);

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

describe('basic rest-api as b@b.com', function () {
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
            entries.should.have.length(5);
        });
    });

    it('query view', function () {
        return request.get('/db/test/_view/entryById?key=%22A%22')
            .expect(200)
            .then(rows => {
                rows = JSON.parse(rows.text);
                rows.should.have.length(1);
            });
    });

    it('create new document', function () {
        return request.post('/db/test')
            .send({$id: 'new', $content: {}})
            .expect(200)
            .then(result => {
                result.body.should.be.instanceOf(Object);
                result.body.should.have.property('rev');
            });
    });

    it('non-existent document cannot be updated', function () {
        // document with uuid A does not exist
        return request.put('/db/test/A').send({$id: 'A', $content: {}})
            .expect(404);
    });

    it('existent document cannot be update if no write access', function () {
        // Update document for which user has no access
        return request.put('/db/test/B').send({$id: 'B', $content: {}})
            .expect(404);
    });

    it('update existing document with no _rev return 409 (conflict)', function () {
        return request.put('/db/test/C').send({$id: 'C', $content: {}})
            .expect(409);
    });

    it('update document', function () {
         return couch.getEntryById('C', 'b@b.com')
            .then(entry => {
                return request.put('/db/test/C').send({$id: 'C', $content: {}, _rev: entry._rev})
                    .expect(200)
                    .then(res => {
                        res.body.should.have.property('rev');
                        res.body.rev.should.startWith('2');
                    });
            });
    });

});
