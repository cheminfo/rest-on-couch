'use strict';

const router = require('koa-router')({
    prefix: '/db'
});

const couch = require('../middleware/couch');
const util = require('../middleware/util');

router.use(couch.setupCouch);

const parseJson100mb = util.parseBody({jsonLimit: '100mb'});

exports.init = function () {
    // User related routes
    router.get('/:dbname/_user', couch.getUser);
    router.post('/:dbname/_user', util.parseBody({jsonLimit: '1mb'}), couch.editUser);

    // Get all entries by user
    router.get('/:dbname/_all/entries', couch.allEntries);

    // Get a document
    router.get('/:dbname/:uuid', couch.getDocumentByUuid);

    // Get a view
    router.get('/:dbname/_view/:view', couch.queryEntriesByUser);

    // Get an attachment
    router.get('/:dbname/:uuid/:attachment+', couch.getAttachmentByUuid);

    // Update a document
    router.put('/:dbname/:uuid', parseJson100mb, couch.updateEntry);

    // Send an attachment to a document
    router.put('/:dbname/:uuid/:attachment+', util.parseRawBody({limit: '100mb'}), couch.saveAttachment);

    // Delete a document
    router.delete('/:dbname/:uuid', couch.deleteEntry);

    // Create a new document
    router.post('/:dbname', parseJson100mb, couch.newOrUpdateEntry);

    // Queries
    router.post('/:dbname/_query/byKindAndId/:kind', parseJson100mb, couch.entriesByKindAndId);
    router.post('/:dbname/_query/byOwnerAndId/:email', parseJson100mb, couch.entriesByOwnerAndId);

    return router;
};
