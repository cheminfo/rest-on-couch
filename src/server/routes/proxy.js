"use strict";
const proxy = require('koa-proxy');
const _ = require('lodash');
const auth = require('./../middleware/auth');
const error = require('../error');
const constants = require('../../constants');
const couch = require('../middleware/couch');

const routesNoAuth    = ['/','/_uuids'];

exports.init = function(router, config) {
    for(var i=0; i<routesNoAuth.length; i++) {
        router.get(routesNoAuth[i], changeHost, proxy({
            url: constants.REST_COUCH_URL + routesNoAuth[i]
        }))
    }

    function *changeHost(next) {
        this.headers.host = config.couchHost;
        yield next;
    }

    // Get a document
    router.get('/:database/:id', couch.getDocumentByUuid);

    // Create new document
    router.put('/:database/:id', couch.newEntry);

    //// Create new document. No need to check that email matches.
    //router.put('/:database/:id', auth.ensureAuthenticated, getDocument(false), changeHost, addAuthCookie, proxy({
    //    host: constants.REST_COUCH_URL
    //}));

    //// Views users can access with access limited to their own email
    //router.get('/:database/_design/flavor/_view/list', auth.ensureAuthenticated, handleList);
    //router.get('/:database/_design/flavor/_list/sort/docs', auth.ensureAuthenticated, function*() {
    //    // We ignore the key parameter that is sent
    //    // We enforce the key to be the email of the logged user
    //    try {
    //        var flavor, doc, headers;
    //        var query = this.request.query;
    //        var key = query.key;
    //        if(key) key = JSON.parse(key);
    //
    //        if(key instanceof Array) {
    //            key[1] = auth.getUserEmail(this);
    //            key[0] = key[0] || 'default';
    //        }
    //        query.key = key;
    //        var res = yield couchdb.db.viewWithList('flavor', 'docs', 'sort', query);
    //
    //        doc = res[0];
    //        headers = res[1];
    //        this.response.body = doc;
    //        this.set(headers);
    //
    //
    //    } catch(e) {
    //        error.handleError(this, e);
    //    }
    //});
    //
    //function *handleList() {
    //    // We ignore the key parameter that is sent
    //    // We enforce the key to be the email of the logged user
    //    try {
    //        var doc, headers;
    //        var email = auth.getUserEmail(this);
    //        var res = yield couchdb.db.view('flavor', 'list', {key: email});
    //
    //        // Grant access
    //        doc = res[0];
    //        headers = res[1];
    //        this.response.body = doc;
    //        this.set(headers);
    //
    //    } catch(e) {
    //        error.handleError(this, e);
    //    }
    //}
    //
    //// List users can access, limited to their own email.
    //router.get('/:database/_design/flavor/_list/config/alldocs', auth.ensureAuthenticated, function*() {
    //    // We ignore the key parameter that is sent
    //    // We enforce the key to be the email of the logged user
    //    try {
    //        var doc, headers;
    //        var email = auth.getUserEmail(this);
    //        var res = yield couchdb.db.viewWithList('flavor', 'alldocs', 'config', {key: email});
    //
    //        // Grant access
    //        doc = res[0];
    //        headers = res[1];
    //        this.response.body = doc;
    //        this.set(headers);
    //
    //
    //    } catch(e) {
    //        error.handleError(this, '', e);
    //    }
    //});
    //
    //// View to with users have access, limit to their own email.
    //router.get('/:database/_design/flavor/_view/docs', auth.ensureAuthenticated, function*() {
    //    // We ignore the key parameter that is sent
    //    // We enforce the key to be the email of the logged user
    //    try {
    //        var flavor, doc, headers;
    //        var query = this.request.query;
    //        var key = query.key;
    //        if(key) key = JSON.parse(key);
    //
    //        if(key instanceof Array) {
    //            key[1] = auth.getUserEmail(this);
    //            key[0] = key[0] || 'default';
    //        }
    //        query.key = key;
    //        var res = yield couchdb.db.view('flavor', 'docs', query);
    //
    //        // Grant access
    //        doc = res[0];
    //        headers = res[1];
    //        this.response.body = doc;
    //        this.set(headers);
    //
    //
    //    } catch(e) {
    //        error.handleError(this, e);
    //    }
    //});

    //// Get an attachment. Work with /-separated attachment names
    //router.get('/:database/:id/:attachment+', auth.ensureAuthenticated, getDocument(true),  auth.ensureIsPublicOrEmailMatches, changeHost, addAuthCookie, proxy({
    //    host: constants.REST_COUCH_URL
    //}));
    //
    //// Save an attachment. Works with /-separated attachment names
    //router.put('/:database/:id/:attachment+', auth.ensureAuthenticated, getDocument(true), auth.ensureEmailMatches, changeHost, addAuthCookie, proxy({
    //    host: constants.REST_COUCH_URL
    //}));
};

function getDocument(treatMissingAsError) {
    return function *(next) {
        try{
            this.state.couchdb = {};
            var res = yield couchdb.db.get(this.params.id);
            this.state.couchdb.document = res[0];
            this.state.couchdb.headers = res[1];
        }
        catch(e) {
            if(!treatMissingAsError && e.reason === 'missing') {
                this.state.couchdb.document = null;
            }
            else {
                return error.handleError(this, e);
            }
        }
        yield next;
    }
}
