'use strict';

const entryUnicity = require('./data/entryUnicity');

describe('global entry unicity', function () {
    beforeEach(entryUnicity);
    it('createEntry should fail', function () {
        return couch.createEntry('A', 'a@a.com', {throwIfExists: true}).should.be.rejectedWith(/entry already exists/);
    });

    it('insertEntry should fail', function () {
        return couch.insertEntry({$id: 'A', $content: {}}, 'a@a.com').should.be.rejectedWith(/entry already exists/);
    });
});
