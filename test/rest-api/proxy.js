'use strict';

const server = require('../../src/server/server');
const supertest = require('supertest-as-promised')(Promise);

server.init('src/server/config.test.json');
let request = supertest.agent(server.app.callback());

describe('requests that are proxied to couch db', function () {
    it('_uuids', function() {
        // couchdb returns text/plain so you have to parse the response yourself...
        return request.get('/_uuids').expect(200)
            .then(res => {
                const uuids = JSON.parse(res.text);
                uuids.should.have.property('uuids');
                uuids.uuids.should.have.length(1);
            });
    });
});
