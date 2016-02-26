'use strict';

const data = require('./data/data');
const noRights = require('./data/noRights');

describe('Query default data', function () {
    before(data);
    it('Should query by user id', function () {
        return couch.queryViewByUser('a@a.com', 'entryById')
            .then(rows => {
                rows.length.should.equal(5);
            });
    });

    it('Should query limiting the size of the response', function () {
        return couch.queryViewByUser('a@a.com', 'entryById', {limit: 2})
            .then(rows => {
                rows.length.should.equal(2);
            });
    });

    it('Should query by user id with key', function () {
        return couch.queryViewByUser('a@a.com', 'entryById', {key: 'A'})
            .then(rows => {
                rows.length.should.equal(1);
            });
    });
});

describe('Query no rights data', function () {
    before(noRights);
    it('Should not grant access to all entries', function () {
        return couch.queryViewByUser('a@a.com', 'entryById')
            .then(rows => {
                rows.length.should.equal(5);
            });
    });
});

describe('Query view with owner (global right)', function () {
    before(data);
    it('should return all docs with global right', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight')
            .then(res => {
                res.sort().should.eql(['A', 'B', 'C', 'anonymousEntry', 'entryWithAttachment']);
            });
    });
});

describe('Query view with owner (group right)', function () {
    before(noRights);
    it('should return authorized docs for user', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight')
            .then(res => {
                res.sort().should.eql([
                    'A',
                    'entryWithDefaultAnonymousRead',
                    'entryWithDefaultAnyuserRead',
                    'entryWithDefaultMultiRead',
                    'onlyA'
                ]);
            });
    });
    it('should return authorized docs for anonymous', function () {
        return couch.queryEntriesByRight('anonymous', 'entryIdByRight')
            .then(res => {
                res.sort().should.eql([
                    'entryWithDefaultAnonymousRead',
                    'entryWithDefaultMultiRead'
                ]);
            });
    });
});
