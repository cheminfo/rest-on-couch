'use strict';

const router = require('koa-router')({
    prefix: '/db'
});

const couch = require('../middleware/couch');
const util = require('../middleware/util');

router.use(couch.setupCouch);

const parseJson1mb = util.parseBody({jsonLimit: '1mb'});
const parseJson100mb = util.parseBody({jsonLimit: '100mb'});

exports.init = function () {
    // Entries
    router.post('/:dbname/entry', parseJson100mb, couch.newOrUpdateEntry);
    router.get('/:dbname/entry/_all', couch.allEntries);
    router.get('/:dbname/entry/:uuid', couch.getDocumentByUuid);
    router.put('/:dbname/entry/:uuid', parseJson100mb, couch.updateEntry);
    router.delete('/:dbname/entry/:uuid', couch.deleteEntry);

    // Owners
    router.get('/:dbname/entry/:uuid/_owner', couch.getOwnersByUuid);
    router.put('/:dbname/entry/:uuid/_owner/:owner', parseJson1mb, couch.addOwnerByUuid);
    router.delete('/:dbname/entry/:uuid/_owner/:owner', parseJson1mb, couch.removeOwnerByUuid);

    // Attachments
    router.get('/:dbname/entry/:uuid/:attachment+', couch.getAttachmentByUuid);
    router.put('/:dbname/entry/:uuid/:attachment+', util.parseRawBody({limit: '100mb'}), couch.saveAttachment);

    // User related routes
    router.get('/:dbname/user/_me', couch.getUser);
    router.post('/:dbname/user/_me', parseJson1mb, couch.editUser);

    // Get a view
    router.get('/:dbname/_view/:view', couch.queryEntriesByUser);

    // Get result from a view with owner
    router.get('/:dbname/_query/:view', couch.queryEntriesByRight);

    // Queries
    router.post('/:dbname/_query/byKindAndId/:kind', parseJson100mb, couch.entriesByKindAndId);
    router.post('/:dbname/_query/byOwnerAndId/:email', parseJson100mb, couch.entriesByOwnerAndId);

    return router;
};
