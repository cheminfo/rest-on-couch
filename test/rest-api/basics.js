'use strict';

const server = require('../../src/server/server');
const data = require('../data/data');
const supertest = require('supertest-as-promised');

let request;
function start() {
    return server.start().then(app => {
        request = supertest(app);
    });
}
before(start);

describe('basic rest-api test', function () {
    before(data);
    it('basic', function () {
        return couch.getEntryById('A', 'b@b.com').then(entry => {
            return request.get(`/test/${entry._id}`)
                .expect(200);
        })
    });
});