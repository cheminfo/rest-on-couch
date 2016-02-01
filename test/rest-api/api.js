'use strict';

const request = require('../setup').getAgent();
const noRights = require('../data/noRights');
const data = require('../data/data');
const authenticateAs = require('./authenticate');

describe('basic rest-api as anonymous (noRights)', function () {
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
            entries.should.have.length(2);
        });
    });
});

describe('rest-api as anonymous (data)', function () {
    before(data);

    it('save an attachment', function () {
        return request.put('/db/test/B/myattachment.txt')
            .set('Content-Type', 'text/plain')
            .set('Accept', 'application/json')
            .send('hello world')
            .expect(200).then(res => {
                res.body.id.should.equal('B');
                res.body.rev.should.startWith('2');
                return request.get('/db/test/B/myattachment.txt').then(res => {
                    res.text.should.equal('hello world');
                    res.headers['content-type'].should.equal('text/plain');
                });
            });
    });
});

describe('basic rest-api as b@b.com', function () {
    before(() => {
        return data().then(authenticateAs(request, 'b@b.com', '123'));
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

    it('delete document', function () {
        return request.del('/db/test/C')
            .expect(200)
            .then(res => {
                res.body.should.eql({ok: true});
            });
    });

});
