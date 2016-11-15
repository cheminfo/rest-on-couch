'use strict';

const assert = require('assert');
const compose = require('koa-compose');
const request = require('request-promise');

const auth = require('./auth');
const config = require('../../config/config').globalConfig;
const getConfig = require('../../config/config').getConfig;
const Couch = require('../../index');
const debug = require('../../util/debug')('middleware:couch');
const views = require('../../design/views');
const CouchError = require('../../util/CouchError');

const couchNeedsParse = ['key', 'startkey', 'endkey'];

const statusMessages = {
    '400': 'bad request',
    '401': 'unauthorized',
    '404': 'not found',
    '409': 'conflict',
    '500': 'internal server error'
};

const OK = {ok: true};

exports.setupCouch = function*(next) {
    if (this.params.dbname) {
        const dbname = this.params.dbname;
        this.state.dbName = dbname;
        this.state.userEmail = this.query.asAnonymous ? 'anonymous' : yield auth.getUserEmail(this);
        this.state.couch = Couch.get(dbname);
        processCouchQuery(this);
    }
    yield next;
};

exports.tokenLookup = function* (next) {
    if (this.query.token) {
        try {
            this.query.token = yield this.state.couch.getToken(this.query.token);
        } catch (e) {
            if (e.reason === 'not found') {
                onGetError(this, new CouchError('token not found', 'unauthorized'));
            } else {
                onGetError(this, e);
            }
            return;
        }
    }
    yield next;
};

exports.getAllDbs = function*() {
    let allDbs = yield request.get(config.url + '/_all_dbs', {json: true});
    allDbs = allDbs.filter((dbname) => !dbname.startsWith('_'));
    const result  = [];
    for (const dbname of allDbs) {
        const db = Couch.get(dbname);
        try {
            yield db.open();
            result.push(dbname);
        } catch (e) {
            // ignore error (means that database is not handled by ROC)
        }
    }
    this.body = result;
};

exports.getDocument = composeWithError(function*() {
    this.body = yield this.state.couch.getEntry(this.params.uuid, this.state.userEmail, this.query);
});

exports.updateEntry = composeWithError(function*() {
    const body = this.request.body;
    if (body) body._id = this.params.uuid;
    const result = yield this.state.couch.insertEntry(body, this.state.userEmail, {isUpdate: true});
    assert.strictEqual(result.action, 'updated');
    this.body = result.info;
});

exports.deleteEntry = composeWithError(function*() {
    yield this.state.couch.deleteEntry(this.params.uuid, this.state.userEmail);
    this.body = OK;
});

exports.newOrUpdateEntry = composeWithError(function*() {
    const options = {};
    if (this.request.body.$owners) {
        options.groups = this.request.body.$owners;
    }
    const result = yield this.state.couch.insertEntry(this.request.body, this.state.userEmail, options);
    this.body = result.info;
    if (result.action === 'created') {
        this.status = 201;
        this.set('Location', `${this.state.urlPrefix}db/${this.state.dbName}/entry/${result.info.id}`);
    } else {
        this.status = 200;
    }
});

exports.deleteAttachment = composeWithError(function*() {
    this.body = yield this.state.couch.deleteAttachment(this.params.uuid, this.state.userEmail, this.params.attachment);
});

exports.saveAttachment = composeWithError(function*() {
    this.body = yield this.state.couch.addAttachment(this.params.uuid, this.state.userEmail, {
        name: this.params.attachment,
        data: this.request.body,
        content_type: this.get('Content-Type')
    });
});

exports.getAttachment = composeWithError(function*() {
    this.body = yield this.state.couch.getAttachmentByName(this.params.uuid, this.params.attachment, this.state.userEmail, true, this.query);
});

exports.allEntries = composeWithError(function*() {
    const right = this.query.right || 'read';
    this.body = yield this.state.couch.getEntriesByUserAndRights(this.state.userEmail, right, this.query);
});

exports.queryEntriesByUser = composeWithError(function*() {
    if (this.query.reduce) {
        this.body = yield this.state.couch.queryViewByUser(this.state.userEmail, this.params.view, this.query);
    } else {
        this.body = yield this.state.couch.queryEntriesByUser(this.state.userEmail, this.params.view, this.query);
    }
});

exports.queryEntriesByRight = composeWithError(function*() {
    this.body = yield this.state.couch.queryEntriesByRight(this.state.userEmail, this.params.view, this.query.right, this.query);
});

exports.entriesByKindAndId = composeWithError(function*() {
    for (let i = 0; i < couchNeedsParse.length; i++) {
        let queryParam = this.query[couchNeedsParse[i]];
        let bodyParam = this.request.body[couchNeedsParse[i]];
        if (queryParam || bodyParam) {
            this.query[couchNeedsParse[i]] = [this.params.kind, queryParam ? queryParam : bodyParam];
        }
    }

    this.body = yield this.state.couch.queryEntriesByUser(this.state.userEmail, 'entryByKindAndId', this.query);
});

exports.entriesByOwnerAndId = composeWithError(function*() {
    for (let i = 0; i < couchNeedsParse.length; i++) {
        let queryParam = this.query[couchNeedsParse[i]];
        let bodyParam = this.request.body[couchNeedsParse[i]];
        if (queryParam || bodyParam) {
            this.query[couchNeedsParse[i]] = [this.params.email, queryParam ? queryParam : bodyParam];
        }
    }
    this.body = yield this.state.couch.queryEntriesByUser(this.state.userEmail, 'entryByOwnerAndId', this.query);
});

exports.getUser = composeWithError(function*() {
    this.body = yield this.state.couch.getUser(this.state.userEmail);
});

exports.editUser = composeWithError(function*() {
    this.body = yield this.state.couch.editUser(this.state.userEmail, this.request.body);
});

exports.getOwners = composeWithError(function*() {
    const doc = yield this.state.couch.getEntry(this.params.uuid, this.state.userEmail);
    this.body = doc.$owners;
});

exports.addOwner = composeWithError(function*() {
    yield this.state.couch.addGroupToEntry(this.params.uuid, this.state.userEmail, this.params.owner);
    this.body = OK;
});

exports.removeOwner = composeWithError(function*() {
    yield this.state.couch.removeGroupFromEntry(this.params.uuid, this.state.userEmail, this.params.owner);
    this.body = OK;
});

exports.getGroup = composeWithError(function*() {
    this.body = yield this.state.couch.getGroup(this.params.name, this.state.userEmail);
});

exports.getGroups = composeWithError(function*() {
    const right = this.params.right || 'read';
    this.body = yield this.state.couch.getGroupsByRight(this.state.userEmail, right);
});

exports.getRights = composeWithError(function*() {
    const right = this.params.right;
    const uuid = this.params.uuid;
    this.body = yield this.state.couch.hasRightForEntry(uuid, this.state.userEmail, right, this.query);
});

/* todo implement it
exports.createOrUpdateGroup = function *() {
    try {
        const group = yield this.state.couch.getGroup(this.params.name, this.state.userEmail);

    } catch (e) {
        if (e.reason === 'not found') {
            try {
                yield this.state.couch.createGroup(this.params.name, this.state.userEmail, this.body.rights);
            } catch (e) {
                onGetError(this, e);
            }
        } else {
            onGetError(this, e);
        }
    }
};*/


exports.deleteGroup = composeWithError(function*() {
    yield this.state.couch.deleteGroup(this.params.name, this.state.userEmail);
    this.body = OK;
});

exports.createEntryToken = composeWithError(function*() {
    const token = yield this.state.couch.createEntryToken(this.state.userEmail, this.params.uuid);
    this.status = 201;
    this.body = token;
});

exports.getTokens = composeWithError(function*() {
    this.body = yield this.state.couch.getTokens(this.state.userEmail);
});

exports.getTokenById = composeWithError(function*() {
    this.body = yield this.state.couch.getToken(this.params.tokenid);
});

exports.deleteTokenById = composeWithError(function*() {
    yield this.state.couch.deleteToken(this.state.userEmail, this.params.tokenid);
    this.body = OK;
});

function onGetError(ctx, e, secure) {
    switch (e.reason) {
        case 'unauthorized':
            if (!secure) {
                ctx.status = 401;
                ctx.body = statusMessages[401];
                break;
            }
            // fallthrough
        case 'not found':
            ctx.status = 404;
            ctx.body = statusMessages[404];
            break;
        case 'conflict':
            ctx.status = 409;
            ctx.body = statusMessages[409];
            break;
        case 'invalid':
            ctx.status = 400;
            ctx.body = e.message || statusMessages[400];
            break;
        default:
            if (!handleCouchError(ctx, e, secure)) {
                ctx.status = 500;
                ctx.body = statusMessages[500];
                debug.error(e + e.stack);
            }
            break;
    }
    if (config.debugrest) {
        ctx.body += '\n\n' + e + '\n' + e.stack;
    }
}

function handleCouchError(ctx, e, secure) {
    if (e.scope !== 'couch') {
        return false;
    }
    var statusCode = e.statusCode;
    if (statusCode) {
        if (statusCode === 404 && secure) {
            statusCode = 401;
        }

        if (statusCode === 500) {
            debug.error(e + e.stack);
        }

        ctx.status = statusCode;
        ctx.body = statusMessages[statusCode] || `error ${statusCode}`;
        return true;
    }
    return false;
}


function processCouchQuery(ctx) {
    for (let i = 0; i < couchNeedsParse.length; i++) {
        if (ctx.query[couchNeedsParse[i]]) {
            try {
                ctx.query[couchNeedsParse[i]] = JSON.parse(ctx.query[couchNeedsParse[i]]);
            } catch (e) {
                // Keep original value if parsing failed
            }
        }
    }
    if (ctx.query.limit !== undefined) {
        ctx.query.limit = +ctx.query.limit;
        if (Number.isNaN(ctx.query.limit)) {
            ctx.query.limit = undefined;
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

    if ((match = q.match(/^([<>=]{1,2})([^<>=]+)$/))) {
        if (match[1] === '<') {
            query.startkey = '';
            query.endkey = match[2];
            query.inclusive_end = false;
        } else if (match[1] === '<=' || match[1] === '=<') {
            query.startkey = '';
            query.endkey = match[2];
        } else if (match[1] === '>' || match[1] === '>=' || match[1] === '=>') {
            query.startkey = match[2];
            if (type !== 'number') {
                query.endkey = '\ufff0';
            }
        } else if (match[1] === '==' || match[1] === '=') {
            query.key = match[2];
        }
    } else if ((match = q.match(/^(.+)\.\.(.+)$/))) {
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
    for (var i = 0; i < couchNeedsParse.length; i++) {
        if (query[couchNeedsParse[i]] !== undefined) {
            switch (type) {
                case 'string':
                    query[couchNeedsParse[i]] = String(query[couchNeedsParse[i]]);
                    break;
                case 'number':
                    query[couchNeedsParse[i]] = +query[couchNeedsParse[i]];
                    break;
                default:
                    throw new Error(`unexpected type: ${type}`);
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
        if (customDesign && customDesign.views && customDesign.views[ctx.params.view]) {
            return customDesign.views[ctx.params.view].type;
        }
    }
    return 'unknown';
}

function* errorMiddleware(next) {
    try {
        yield next;
    } catch (e) {
        onGetError(this, e);
    }
}

function composeWithError(middleware) {
    return compose([errorMiddleware, middleware]);
}
