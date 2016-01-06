'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};
const couchToProcess = ['key', 'startkey', 'endkey'];

exports.getDocumentByUuid = function * (next) {
    const database = this.params.database;
    const userEmail = yield auth.getUserEmail(this);
    const couch = getCouch(database);
    try {
        const doc = yield couch.getEntryByUuid(this.params.id, userEmail);
        this.status = 200;
        this.body = doc;
    } catch (e) {
        onGetError(this, e);
    }
    yield next;
};

exports.newEntry = function * (next) {
    const database = this.params.database;
    const userEmail = yield auth.getUserEmail(this);
    const couch = getCouch(database);
    const body = this.request.body;
    if (body) body._id = this.params.id;
    try {
        yield couch.insertEntry(this.request.body, userEmail);
        this.status = 200;
    } catch (e) {
        switch (e.reason) {
            case 'unauthorized':
                this.status = 401;
                this.body = 'unauthorized';
                break;
            default:
                this.status = 500;
                this.body = 'internal server error';
                break;
        }
    }
    yield next;
};

exports.allEntries = function * (next) {
    const database = this.params.database;
    const userEmail = yield auth.getUserEmail(this);
    const couch = getCouch(database);

    try {
        const entries = yield couch.getEntriesByUserAndRights(userEmail, 'read');
        this.status = 200;
        this.body = entries;
    } catch (e) {
        onGetError(this, e);
    }

    yield next;
};

exports.queryViewByUser = function * (next) {
    const database = this.params.database;
    const userEmail = yield auth.getUserEmail(this);
    const couch = getCouch(database);


    try {
        processCouchQuery(this);
        this.body = yield couch.queryViewByUser(userEmail, this.params.view, this.query);
        this.status = 200;
    } catch(e) {
        onGetError(this, e);
    }
};

function getCouch(database) {
    if (!couchMap[database]) {
        couchMap[database] = new Couch({
            database
        });
    }
    return couchMap[database];
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