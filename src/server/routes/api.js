'use strict';

const router = require('koa-router')({
    prefix: '/db'
});

const couch = require('../middleware/couch');

router.use(couch.setupCouch);

exports.init = function() {
    // User related routes
    router.get('/:dbname/_user', couch.getUser);
    router.post('/:dbname/_user', couch.editUser);

    // Get all entries by user
    router.get('/:dbname/_all/entries', couch.allEntries);

    // Get a document
    router.get('/:dbname/:uuid', couch.getDocumentByUuid);

    // Get a view
    router.get('/:dbname/_view/:view', couch.queryEntriesByUser);

    // Get an attachment
    router.get('/:dbname/:uuid/:attachment', couch.getAttachmentByUuid);

    // Update a document
    router.put('/:dbname/:uuid', couch.updateEntry);

    // Send an attachment to a document
    router.put('/:dbname/:uuid/:attachment', couch.saveAttachment);

    // Delete a document
    router.delete('/:dbname/:uuid', couch.deleteEntry);

    // Create a new document
    router.post('/:dbname', couch.newOrUpdateEntry);

    // Queries
    router.post('/:dbname/_query/byKindAndId/:kind', couch.entriesByKindAndId);
    router.post('/:dbname/_query/byOwnerAndId/:email', couch.entriesByOwnerAndId);

    return router;
};
