'use strict';

const debug = require('debug')('couch:nano');

const constants = require('../constants');

exports.authenticate = function (nano, user, password) {
    return new Promise((resolve, reject) => {
        debug('auth ' + user);
        nano.auth(user, password, function (err, body, headers) {
            if (err) {
                debug('auth failed');
                return reject(err);
            }
            if (headers && headers['set-cookie']) {
                debug('auth success');
                return resolve(headers['set-cookie']);
            }
            reject(new Error('cookie auth not supported'));
        })
    });
};

exports.getDatabase = function (nano, database) {
    return new Promise((resolve, reject) => {
        debug('getDatabase ' + database);
        nano.db.get(database, function (err) {
            if (err) {
                if (err.reason === 'no_db_file') {
                    debug('database not found');
                    return resolve(false);
                }
                debug('getDatabase failed');
                return reject(err);
            }
            debug('database exists');
            resolve(true);
        });
    });
};

exports.createDatabase = function (nano, database) {
    return new Promise((resolve, reject) => {
        debug('createDatabase ' + database);
        nano.db.create(database, function (err) {
            if (err) {
                debug('create failed');
                return reject(err);
            }
            debug('database created');
            resolve();
        });
    });
};

exports.getDocument = function (db, docID) {
    return new Promise((resolve, reject) => {
        debug('getDocument ' + docID);
        db.get(docID, function (err, result) {
            if (err) {
                if (err.statusCode === 404 && (err.reason === 'missing' || err.reason === 'deleted')) {
                    debug('document missing');
                    return resolve(null);
                }
                debug('getDocument failed');
                return reject(err);
            }
            debug('found document');
            resolve(result);
        });
    });
};

exports.insertDocument = function (db, doc) {
    return new Promise((resolve, reject) => {
        debug('insertDocument ' + doc._id);
        db.insert(doc, function (err, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
};

exports.queryView = function (db, view, params, options) {
    options = options || {};
    return new Promise((resolve, reject) => {
        debug('queryView ' + view);
        db.view(constants.DESIGN_DOC_NAME, view, params, function (err, body) {
            if (err) return reject(err);
            if (options.onlyValue) {
                resolve(body.rows.map(row => row.value));
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

exports.updateWithHandler = function(db, update, docId, body) {
    return new Promise((resolve, reject) => {
        debug('update with handler');
        db.atomic(constants.DESIGN_DOC_NAME, update, docId, body, function(err, body) {
            if(err) return reject(err);
            resolve(body);
        });
    });
};

exports.attachFiles = function (db, doc, files) {
    return new Promise((resolve, reject) => {
        debug('attach files');
        db.multipart.insert(doc, files, doc._id, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
};
