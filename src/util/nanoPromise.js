'use strict';

const constants = require('../constants');
const debug = require('./debug')('nano');

exports.authenticate = function (nano, user, password) {
    return new Promise((resolve, reject) => {
        debug('auth ' + user);
        nano.auth(user, password, function (err, body, headers) {
            if (err) {
                debug.warn('auth failed');
                return reject(err);
            }
            if (headers && headers['set-cookie']) {
                debug('auth success');
                return resolve(headers['set-cookie']);
            }
            reject(new Error('cookie auth not supported'));
        });
    });
};

exports.getDatabase = function (nano, database) {
    return new Promise((resolve, reject) => {
        debug.trace('getDatabase ' + database);
        nano.db.get(database, function (err) {
            if (err) {
                if (err.reason === 'no_db_file') {
                    debug.trace('database not found');
                    return resolve(false);
                }
                debug.warn('getDatabase failed');
                return reject(err);
            }
            debug.trace('database exists');
            resolve(true);
        });
    });
};

exports.createDatabase = function (nano, database) {
    return new Promise((resolve, reject) => {
        debug.trace('createDatabase ' + database);
        nano.db.create(database, function (err) {
            if (err) {
                debug.warn('create failed');
                return reject(err);
            }
            debug('database created');
            resolve();
        });
    });
};

exports.getDocument = function (db, docID) {
    return new Promise((resolve, reject) => {
        debug.trace(`getDocument ${docID}`);
        db.get(docID, function (err, result) {
            if (err) {
                if (err.statusCode === 404 && (err.reason === 'missing' || err.reason === 'deleted')) {
                    debug.trace('document missing');
                    return resolve(null);
                }
                debug.warn('getDocument failed');
                return reject(err);
            }
            debug.trace('found document');
            resolve(result);
        });
    });
};

exports.insertDocument = function (db, doc) {
    return new Promise((resolve, reject) => {
        debug.trace(`insertDocument with _id ${doc._id}`);
        db.insert(doc, function (err, body) {
            if (err) return reject(err);
            debug.trace('document inserted');
            resolve(body);
        });
    });
};

exports.queryView = function (db, view, params, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
        debug.trace(`queryView ${view}`);
        db.view(constants.DESIGN_DOC_NAME, view, params, function (err, body) {
            if (err) return reject(err);
            if (options.onlyValue) {
                resolve(body.rows.map(row => row.value));
            } else if (options.onlyDoc) {
                resolve(body.rows.map(row => row.doc));
            } else {
                resolve(body.rows);
            }
        });
    });
};

exports.destroyDatabase = function (nano, dbName) {
    return new Promise((resolve, reject) => {
        debug('destroy database ' + dbName);
        nano.db.destroy(dbName, function (err, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

exports.destroyDocument = function(db, docId, revId) {
    debug.trace('destroy document');
    if (!revId) {
        return exports.getDocument(db, docId).then(doc => {
            if (!doc || !doc._rev) return null;
            return exports.destroyDocument(db, docId, doc._rev);
        });
    }
    return new Promise(function(resolve, reject) {
        db.destroy(docId, revId, function(err, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

exports.updateWithHandler = function(db, update, docId, body) {
    return new Promise((resolve, reject) => {
        debug.trace(`update with handler ${JSON.stringify(body)}`);
        db.atomic(constants.DESIGN_DOC_NAME, update, docId, body, function(err, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

exports.attachFiles = function (db, doc, files) {
    return new Promise((resolve, reject) => {
        debug.trace('attach files');
        db.multipart.insert(doc, files, doc._id, function (err, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

exports.getAttachment = function (db, doc, name, asStream) {
    return new Promise((resolve, reject) => {
        debug.trace(`get attachment ${doc}/${name}`);
        if (asStream) {
            const stream = db.attachment.get(doc, name);
            resolve(stream);
        } else {
            db.attachment.get(doc, name, function (err, body) {
                if (err) return reject(err);
                resolve(body);
            });
        }
    });
};
