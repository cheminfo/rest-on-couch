'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};
const couchToProcess = ['key', 'startkey', 'endkey'];

exports.setupCouch = function*(next) {
    const dbname = this.params.dbname;
    this.state.userEmail = yield auth.getUserEmail(this);
    this.state.couch = getCouch(dbname);
    yield next;
};

exports.getDocumentByUuid = function*() {
    try {
        const doc = yield this.state.couch.getEntryByUuid(this.params.id, this.state.userEmail);
        this.status = 200;
        this.body = doc;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.newEntry = function*() {
    const body = this.request.body;
    if (body) body._id = this.params.id;
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
    }
};

exports.getAttachmentById = function*() {
    try {
        console.log('get att by id')
        const entries = yield this.state.couch.getAttachmentByIdAndName(this.params.id, this.params.attachment, this.state.userEmail, true);
        this.status = 200;
        this.body = entries;
    } catch (e) {
        onGetError(this, e);
    }
};

exports.allEntries = function*() {
    try {
        const entries = yield this.state.couch.getEntriesByUserAndRights(this.state.userEmail, 'read');
        this.status = 200;
        this.body = entries;
    } catch (e) {
        console.log(e);
        onGetError(this, e);
    }
};

exports.queryViewByUser = function*() {
    try {
        processCouchQuery(this);
        this.body = yield this.state.couch.queryViewByUser(this.state.userEmail, this.params.view, this.query);
        this.status = 200;
    } catch (e) {
        onGetError(this, e);
    }
};

function getCouch(dbname) {
    if (!couchMap[dbname]) {
        couchMap[dbname] = new Couch({
            database: dbname
        });
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
}

function processCouchQuery(ctx) {
    for (let i = 0; i < couchToProcess.length; i++) {
        if (ctx.query[couchToProcess[i]]) {
            ctx.query[couchToProcess[i]] = JSON.parse(ctx.query[couchToProcess[i]])
        }
    }
}
