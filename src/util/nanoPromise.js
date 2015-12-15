'use strict';

const debug = require('debug')('couch:nano');

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
        db.insert(doc, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
};
