'use strict';

const router = require('koa-router')({
    prefix: '/db'
});

const couch = require('../middleware/couch');

router.use(couch.setupCouch);

exports.init = function() {
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

    // Create a new document
    router.post('/:dbname', couch.newOrUpdateEntry);

    return router;
};
