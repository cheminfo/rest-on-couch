"use strict";
const couch = require('../middleware/couch');

const router = require('koa-router')({
    prefix: '/db'
});

router.use(couch.setupCouch);

exports.init = function() {
    // Get all entries by user
    router.get('/:dbname/_all/entries', couch.allEntries);

    // Get a document
    router.get('/:dbname/:uuid', couch.getDocumentByUuid);

    // Get a view
    router.get('/:dbname/_view/:view', couch.queryViewByUser);

    // Get an attachment
    router.get('/:dbname/:uuid/:attachment', couch.getAttachmentByUuid);

    // Modify a document
    router.put('/:dbname/:uuid', couch.newEntry);

    return router;
};
