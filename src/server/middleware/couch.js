'use strict';

const auth = require('./auth');
const Couch = require('../..');
const couchMap = {};

module.exports.getDocumentByUuid = function * (next) {
    const database = this.params.database;
    const userEmail = auth.getUserEmail(this);
    const couch = getCouch(database);
    console.log(couch)
    const doc = yield couch.getEntryByUuid(this.params.id, userEmail);
    this.status = 200;
    this.body = doc;
};

function getCouch(database) {
    if(!couchMap[database]) {
        couchMap[database] = new Couch({
            database
        });
    }
    return couchMap[database];
}