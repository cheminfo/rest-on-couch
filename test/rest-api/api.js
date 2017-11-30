'use strict';

const request = require('../setup').getAgent();
const noRights = require('../data/noRights');
const data = require('../data/data');
const authenticateAs = require('./authenticate');

describe('basic rest-api as anonymous (noRights)', function () {
    before(noRights);

    it('get an entry', function () {
        return request.get('/db/test/entry/A')
            .expect(401);
    });

    it('get an entry with token', function () {
        return request.get('/db/test/entry/A?token=mytoken')
            .expect(200);
    });

    it('get an entry with token (wrong uuid)', function () {
        return request.get('/db/test/entry/B?token=mytoken')
            .expect(401);
    });

    it('get an entry with token (inexisting token)', function () {
        return request.get('/db/test/entry/B?token=notexist')
            .expect(401);
    });

    it('not allowed to create a token', function () {
        return request.post('/db/test/entry/A/_token')
            .expect(401);
    });

    it('get all entries', function () {
        return request.get('/db/test/entry/_all').expect(200).then(entries => {
            entries = JSON.parse(entries.text);
            entries.should.have.length(2);
        });
    });

    it('get unknown group', function () {
        return request.get('/db/test/group/doesnotexist').expect(404);
    });

    it('get group without permission', function () {
        return request.get('/db/test/group/groupA').expect(401);
    });

    it('_all_dbs', function () {
        return request.get('/db/_all_dbs').expect(200).then((data) => {
            data.body.should.be.an.Array();
        });
    });

    it('forbidden datbase names', function () {
        return request.get('/db/_a$aa/entry/aaa').expect(403).then((data) => {
            data.body.should.deepEqual({error: 'invalid database name', code: 'forbidden'});
        });
    });
});

describe('rest-api as b@b.com (noRights)', function () {
    before(() => {
        return noRights().then(() => authenticateAs(request, 'b@b.com', '123'));
    });

    it('query view with owner, wrong key', function () {
        return request.get('/db/test/_query/entryIdByRight?key=xxx')
            .expect(200)
            .then(rows => {
                rows.text.should.equal('[]');
            });
    });

    it('query view with owner', function () {
        return request.get('/db/test/_query/entryIdByRight?key=' + encodeURIComponent(JSON.stringify(['x', 'y', 'z'])))
            .expect(200)
            .then(rows => {
                rows.text.should.not.equal('[]');
            });
    });

    it('get an entry authenticated', function () {
        return request.get('/db/test/entry/B')
            .expect(200);
    });

    it('get an entry authenticated but asAnonymous', function () {
        return request.get('/db/test/entry/B?asAnonymous=true')
            .expect(401);
    });

    it('check if user has read access to a resource', function () {
        return request.get('/db/test/entry/B/_rights/read')
            .expect(200).then(data => data.body.should.equal(true));
    });

    it('check if user has write access to a resource (as anonymous)', function () {
        return request.get('/db/test/entry/B/_rights/read?asAnonymous=1')
            .expect(200)
            .then(data => data.body.should.equal(false));
    });
});

describe('rest-api as anonymous (data)', function () {
    before(data);

    it('save an attachment', function () {
        return request.put('/db/test/entry/B/myattachment.txt')
            .set('Content-Type', 'text/plain')
            .set('Accept', 'application/json')
            .send('rest-on-couch!!')
            .expect(200).then(res => {
                res.body.id.should.equal('B');
                res.body.rev.should.startWith('2');
                return request.get('/db/test/entry/B/myattachment.txt').then(res => {
                    res.text.should.equal('rest-on-couch!!');
                    res.headers['content-type'].should.equal('text/plain');
                });
            });
    });

    it('deletes an attachment', function () {
        return request.delete('/db/test/entry/B/myattachment.txt')
            .send()
            .expect(200).then(() => {
                return request.get('/db/test/entry/B/myattachment.txt').expect(404);
            });
    });
});

describe('basic rest-api as b@b.com', function () {
    before(() => {
        return data().then(() => authenticateAs(request, 'b@b.com', '123'));
    });

    it('get an entry', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request
                .get(`/db/test/entry/${entry._id}`)
                .expect(200);
        });
    });

    it('get all entries', function () {
        return request.get('/db/test/entry/_all').expect(200).then(entries => {
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

    it('query view with reduce', function () {
        return request.get('/db/test/_view/entryById?reduce=true')
            .expect(200)
            .then(rows => {
                rows = JSON.parse(rows.text);
                rows[0].value.should.equal(5);
            });
    });

    it('create new document', function () {
        return request.post('/db/test/entry')
            .send({$id: 'new', $content: {}})
            .expect(201)
            .then(result => {
                result.body.should.be.instanceOf(Object);
                result.body.should.have.property('rev');
            });
    });

    it('non-existent document cannot be updated', function () {
        // document with uuid A does not exist
        return request.put('/db/test/entry/NOTEXIST').send({$id: 'NOTEXIST', $content: {}})
            .expect(404);
    });

    it('existent document cannot be update if no write access', function () {
        // Update document for which user has no access
        return request.put('/db/test/entry/B').send({$id: 'B', $content: {}})
            .expect(401);
    });

    it('update existing document with no _rev return 409 (conflict)', function () {
        return request.put('/db/test/entry/C').send({$id: 'C', $content: {}})
            .expect(409);
    });

    it('update document', function () {
        return couch.getEntryById('C', 'b@b.com')
            .then(entry => {
                return request
                    .put('/db/test/entry/C')
                    .send({$id: 'C', $content: {}, _rev: entry._rev})
                    .expect(200)
                    .then(res => {
                        res.body.should.have.property('rev');
                        res.body.rev.should.startWith('2');
                    });
            });
    });

    it('create token', function () {
        return request.post('/db/test/entry/C/_token').expect(201);
    });

    it('delete document', function () {
        return request.del('/db/test/entry/C')
            .expect(200)
            .then(res => {
                res.body.should.eql({ok: true});
            });
    });

    it('get group without permission', function () {
        return request.get('/db/test/group/groupA').expect(401);
    });

});

describe('basic rest-api as a@a.com', function () {
    before(() => {
        return data().then(() => authenticateAs(request, 'a@a.com', '123'));
    });

    it('get group with permission', function () {
        return request.get('/db/test/group/groupA').expect(200).then(function (response) {
            response.body.should.have.properties(['name', 'users', 'rights']);
        });
    });

    it('get list of groups', function () {
        return request.get('/db/test/groups').expect(200).then(function (response) {
            response.body.should.have.lengthOf(2);
            response.body[0].should.be.an.Object();
        });
    });
});
