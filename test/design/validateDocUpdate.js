'use strict';

const validateDocUpdate = require('../../src/design/validateDocUpdate');

describe('validate_doc_update', function () {
    describe('general', function () {
        it('$type', function () {
            assert({$type: 'abc'}, null, 'Invalid type');
            assert({$type: 'entry'}, {$type: 'group'}, /Cannot change the type/);
        });
    });
    describe('$type: entry', function () {
        it('id', function () {
            assert({$type: 'entry'}, null, 'ID is mandatory');
            assert(
                addDate({$type: 'entry', $id: 'abc'}),
                addDate({$type: 'entry', $id: 'xyz'}),
                'Cannot change the ID'
            );
        });
        it('date', function () {
            assert({$type: 'entry', $id: 'abc'}, null, /dates are mandatory/);
            assert(addTypeID({$creationDate: 100}), null, /dates are mandatory/);
            assert(addTypeID({$creationDate: 100, $modificationDate: 50}), null, /cannot be before/);
            assert(addTypeID({$creationDate: 99, $modificationDate: 100}), addTypeID({$creationDate: 100}), 'Cannot change creation date');
            assert(addTypeID({$creationDate: 200, $modificationDate: 220}), addTypeID({$creationDate: 200, $modificationDate: 250}), /cannot change to the past/);
        });
    });
});

function assert(newDoc, oldDoc, reg) {
    (function () {
        validateDocUpdate(newDoc, oldDoc);
    }).should.throw({forbidden: reg});
}

function addDate(doc) {
    doc.$creationDate = 100;
    doc.$modificationDate = 100;
    return doc;
}

function addTypeID(doc) {
    doc.$type = 'entry';
    doc.$id = 'abc';
    return doc;
}
