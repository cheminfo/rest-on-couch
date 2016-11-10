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
                res = res.map(x => x.value);
                res.sort().should.eql(['A', 'B', 'C', 'anonymousEntry', 'entryWithAttachment']);
            });
    });
});

describe('Query view with owner (group right)', function () {
    before(noRights);
    it('should return authorized docs for user', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight')
            .then(res => {
                res = res.map(x => x.value);
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
                res = res.map(x => x.value);
                res.sort().should.eql([
                    'entryWithDefaultAnonymousRead',
                    'entryWithDefaultMultiRead'
                ]);
            });
    });
});

describe('Query entries filter groups', function () {
    before(noRights);
    it('should only return entries owned by the user', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {groups: 'a@a.com'})
            .then(res => {
                res.length.should.equal(1);
                res[0].value.should.equal('onlyA');
            });
    });

    it('should only return entries owned by the defaultAnonymousRead group', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {groups: ['defaultAnonymousRead']})
            .then(res => {
                res.length.should.equal(2);
                res.sort(sortByValue);
                res[0].value.should.equal('entryWithDefaultAnonymousRead');
                res[1].value.should.equal('entryWithDefaultMultiRead');
            });
    });

    it('should only return entries owned by the defaultAnonymousRead or defaultAnyuserRead groups', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {groups: ['defaultAnonymousRead', 'defaultAnyuserRead']})
            .then(res => {
                res.length.should.equal(3);
                res.sort(sortByValue);
                res[0].value.should.equal('entryWithDefaultAnonymousRead');
                res[1].value.should.equal('entryWithDefaultAnyuserRead');
                res[2].value.should.equal('entryWithDefaultMultiRead');
            });
    });

    it('should only return entries owned by the owner by using the "mine" option', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {mine: 1})
            .then(res => {
                res.length.should.equal(1);
                res[0].value.should.equal('onlyA');
            });
    });

    it('should return group entries and owner entries when "groups" and "mine" options are used in combination', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {mine: 1, groups: 'defaultAnonymousRead'})
            .then(res => {
                res.length.should.equal(3);
            });
    });

    it('should ignore groups in the "groups" option if the user does not belong to it', function () {
        return couch.queryEntriesByRight('a@a.com', 'entryIdByRight', null, {groups: 'x@x.com'})
            .then(res => {
                res.length.should.equal(0);
            });
    });
});

describe('Query view with reduce', function () {
    before(data);
    it('Should query by user id', function () {
        return couch.queryViewByUser('a@a.com', 'testReduce', {reduce: true})
            .then(rows => {
                // counts the entries
                rows[0].value.should.equal(5);
            });
    });
});

function sortByValue(a, b) {
    if (a.value < b.value) return -1;
    else if (a.value > b.value) return 1;
    return 0;
}
