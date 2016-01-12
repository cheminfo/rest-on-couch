'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};
const couchToProcess = ['key', 'startkey', 'endkey'];
const config = require('../../config/config');

exports.setupCouch = function*(next) {
    const dbname = this.params.dbname;
    this.state.userEmail = yield auth.getUserEmail(this);
    this.state.couch = getCouch(dbname);
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
        switch (e.reason) {
            case 'unauthorized':
                this.status = 401;
                this.body = 'unauthorized';
                break;
            default:
                this.status = 500;
                console.error(e);
                this.body = 'internal server error';
                break;
        }
        if(config.debugrest) {
            this.body += e + e.stack;
        }
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
        console.log(e);
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

function getCouch(dbname) {
    if (!couchMap[dbname]) {
        couchMap[dbname] = new Couch(dbname);
    }
    return couchMap[dbname];
}

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
            console.error(e);
            break;
    }
    if(config.debugrest) {
        ctx.body += e + e.stack;
    }
}

function processCouchQuery(ctx) {
    for (let i = 0; i < couchToProcess.length; i++) {
        if (ctx.query[couchToProcess[i]]) {
            try {
                ctx.query[couchToProcess[i]] = JSON.parse(ctx.query[couchToProcess[i]])
            } catch(e) {

            }
        }
    }
}
