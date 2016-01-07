"use strict";
const proxy = require('koa-proxy');
const _ = require('lodash');
const error = require('../error');
const couch = require('../middleware/couch');

const router = require('koa-router')({
    prefix: '/db'
});

router.use(couch.setupCouch);

exports.init = function(config) {
    // Get all entries by user
    router.get('/:dbname/_all/entries', couch.allEntries);

    // Get a document
    router.get('/:dbname/:id', couch.getDocumentByUuid);

    // Get a view
    router.get('/:dbname/_view/:view', couch.queryViewByUser);

    // Get an attachment
    router.get('/:dbname/:id/:attachment', couch.getAttachment);

    // Modify a document
    router.put('/:dbname/:id', couch.newEntry);

    return router;
};
