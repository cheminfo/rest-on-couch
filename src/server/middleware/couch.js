'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};

module.exports.getDocumentByUuid = function * (next) {
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