'use strict';

const auth = require('./auth');
const config = require('../../config/config').globalConfig;
const getConfig = require('../../config/config').getConfig;
const Couch = require('../../index');
const debug = require('../../util/debug')('middleware:couch');
const views = require('../../design/views');

const couchToProcess = ['key', 'startkey', 'endkey'];

exports.setupCouch = function*(next) {
    const dbname = this.params.dbname;
    this.state.userEmail = yield auth.getUserEmail(this);
    this.state.couch = Couch.get(dbname);
    processCouchQuery(this);
    yield next;
};

exports.getDocumentByUuid = function*() {
    try {
        const doc = yield this.state.couch.getEntryByUuid(this.params.uuid, this.state.userEmail);
        this.status = 200;
        this.body = doc;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.newEntry = function*() {
    const body = this.request.body;
    if (body) body._id = this.params.uuid;
    try {
        yield this.state.couch.insertEntry(this.request.body, this.state.userEmail);
        this.status = 200;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.getAttachmentById = function*() {
    try {
        const stream = yield this.state.couch.getAttachmentByIdAndName(this.params.id, this.params.attachment, this.state.userEmail, true);
        this.status = 200;
        this.body = stream;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.getAttachmentByUuid = function*() {
    try {
        const stream = yield this.state.couch.getAttachmentByUuidAndName(this.params.uuid, this.params.attachment, this.state.userEmail, true);
        this.status = 200;
        this.body = stream;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.allEntries = function*() {
    try {
        const entries = yield this.state.couch.getEntriesByUserAndRights(this.state.userEmail, 'read', this.query);
        this.status = 200;
        this.body = entries;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.queryViewByUser = function*() {
    try {
        this.body = yield this.state.couch.queryViewByUser(this.state.userEmail, this.params.view, this.query);
        this.status = 200;
    } catch (e) {
        onGetError(this, e);
    }
};

function onGetError(ctx, e) {
    switch (e.reason) {
        case 'not found':
        case 'unauthorized':
            ctx.status = 404;
            ctx.body = 'not found';
            break;
        default:
            ctx.status = 500;
            ctx.body = 'internal server error';
            debug.error(e);
            break;
    }
    if (config.debugrest) {
        ctx.body += '\n\n' + e + '\n' + e.stack;
    }
}

function processCouchQuery(ctx) {
    for (let i = 0; i < couchToProcess.length; i++) {
        if (ctx.query[couchToProcess[i]]) {
            try {
                ctx.query[couchToProcess[i]] = JSON.parse(ctx.query[couchToProcess[i]]);
            } catch (e) {
                // Keep original value if parsing failed
            }
        }
    }
    processQuery(ctx);

}

function processQuery(ctx) {
    if (!ctx.params.view || !ctx.query.query) return;

    var query = ctx.query;
    var q = query.query;
    query.key = undefined;
    query.startkey = undefined;
    query.endkey = undefined;
    var match;

    var type = getViewType(ctx);

    if (match = q.match(/^([<>=]{1,2})([^<>=]+)$/)) {
        if (match[1] === '<') {
            query.startkey = '';
            query.endkey = match[2];
            query.inclusive_end = false;
        } else if (match[1] === '<=' || match[1] === '=<') {
            query.startkey = '';
            query.endkey = match[2];
        } else if (match[1] === '>') {
            query.startkey = match[2];
            query.endkey = '\ufff0';
        } else if (match[1] === '>=' || match[1] === '=>') {
            query.startkey = match[2];
            query.endkey = '\ufff0';
        } else if (match[1] === '==' || match[1] === '=') {
            query.key = match[2];
        }
    } else if (match = q.match(/^(.+)\.\.(.+)$/)) {
        query.startkey = match[1];
        query.endkey = match[2];
    } else {
        if (type === 'string') {
            query.startkey = q;
            query.endkey = q + '\ufff0';
        } else {
            query.key = q;
        }
    }

    try {
        if (type) {
            applyType(query, type);
        }
    } catch (e) {
        debug.warn('Could not apply type to query');
    }
}

function applyType(query, type) {
    for (var i = 0; i < couchToProcess.length; i++) {
        if (query[couchToProcess[i]] !== undefined) {
            switch (type) {
                case 'string':
                    query[couchToProcess[i]] = String(query[couchToProcess[i]]);
                    break;
                case 'number':
                    query[couchToProcess[i]] = +query[couchToProcess[i]];
                    break;
            }
        }
    }
}

function getViewType(ctx) {
    var view = views[ctx.params.view];
    if (view && view.type) {
        return view.type;
    } else {
        var customDesign = getConfig(ctx.params.dbname).customDesign;
        if(customDesign && customDesign.views && customDesign.views[ctx.params.view]) {
            return customDesign[ctx.params.view].type;
        }
    }
}
