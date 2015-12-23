"use strict";
const proxy = require('koa-proxy');
const _ = require('lodash');
const error = require('../error');
const couch = require('../middleware/couch');

const router = require('koa-router')();

exports.init = function(config) {
    // Get all entries by user
    router.get('/:database/entries/all', couch.allEntries);

    // Get a document
    router.get('/:database/:id', couch.getDocumentByUuid);

    // Create new document
    router.put('/:database/:id', couch.newEntry);

    return router;
};
