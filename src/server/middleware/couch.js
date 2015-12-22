'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};

exports.getDocumentByUuid = function * (next) {
    const database = this.params.database;
    const userEmail = auth.getUserEmail(this);
    const couch = getCouch(database);
    try {
        const doc = yield couch.getEntryByUuid(this.params.id, userEmail);
        this.status = 200;
        this.body = doc;
    } catch(e) {
        switch(e.reason) {
            case 'not found': case 'unauthorized':
                this.status = 404;
                this.body = 'not found';
                break;
            default:
                this.status = 500;
                this.body = 'internal server error';
                break;
        }
    }
    yield next;
};

exports.newEntry = function * (next) {
    const database = this.params.database;
    const userEmail = auth.getUserEmail(this);
    const couch = getCouch(database);
    const body = this.request.body;
    if(body) body._id = this.params.id;
    try {
        yield couch.insertEntry(this.request.body, userEmail);
    } catch(e) {
        switch(e.reason) {
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

function getCouch(database) {
    if(!couchMap[database]) {
        couchMap[database] = new Couch({
            database
        });
    }
    return couchMap[database];
}

function onError(ctx, error) {

}
