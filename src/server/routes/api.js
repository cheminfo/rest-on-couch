"use strict";
const proxy = require('koa-proxy');
const _ = require('lodash');
const error = require('../error');
const couch = require('../middleware/couch');

const router = require('koa-router')({
    prefix: '/db'
});

exports.init = function(config) {
    // Get all entries by user
    router.get('/:database/entries/all', couch.allEntries);

    // Get a document
    router.get('/:database/:id', couch.getDocumentByUuid);

    // Get a view
    router.get('/:database/_design/app/_view/:view', couch.queryViewByUser);

    // Modify a document
    router.put('/:database/:id', couch.newEntry);

    return router;
};
