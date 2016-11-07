'use strict';

const router = require('koa-router')({
    prefix: '/db'
});

const couch = require('../middleware/couch');
const util = require('../middleware/util');

router.use(couch.setupCouch);
router.use(couch.tokenLookup);

const parseJson1mb = util.parseBody({jsonLimit: '1mb'});
const parseJson100mb = util.parseBody({jsonLimit: '100mb'});

exports.init = function () {
    // Get list of all databases that ROC can handle
    router.get('/_all_dbs', couch.getAllDbs);

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

    // Entry rights
    router.get('/:dbname/entry/:uuid/_rights/:right', couch.getRights);

    // Attachments
    router.get('/:dbname/entry/:uuid/:attachment+', couch.getAttachmentByUuid);
    // Delete attachment slightly different from couchdb api. It does not require _rev in the query parameters.
    router.delete('/:dbname/entry/:uuid/:attachment+', couch.deleteAttachment);
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

    // Groups
    router.get('/:dbname/group/:name', couch.getGroup);
    router.get('/:dbname/groups', couch.getGroups);
    //router.put('/:dbname/group/:name', parseJson1mb, couch.createOrUpdateGroup);
    router.delete('/:dbname/group/:name', couch.deleteGroup);

    // Tokens
    router.post('/:dbname/entry/:uuid/_token', couch.createEntryToken);
    router.get('/:dbname/token', couch.getTokens);
    router.get('/:dbname/token/:tokenid', couch.getTokenById);
    router.delete('/:dbname/token/:tokenid', couch.deleteTokenById);

    return router;
};
