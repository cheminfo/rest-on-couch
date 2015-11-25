#!/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('couch-import');
const validateEmail = require('email-validator').validate;
const program = require('commander');
const pkg = require('../package.json');
const constants = require('./constants');
const designDoc = require('./design/app');

program
    .version(pkg.version)
    .usage('[options] <file>')
    .option('-c, --config <path>', 'Configuration file')
    .parse(process.argv);

if (!program.config) {
    throw new Error('config option is mandatory');
}

if (!program.args.length) {
    throw new Error('you must provide a file');
}

debug('read and verify config');

const config = require(path.resolve(program.config));
const file = path.resolve(program.args[0]);
const filename = path.parse(file).base;
const contents = fs.readFileSync(file);

// CouchDB configuration
const couchURL = verifyConfig('couchURL', process.env.COUCH_URL);
const couchDB = verifyConfig('couchDB', process.env.COUCH_DB);
const couchUser = verifyConfig('couchUser', process.env.COUCH_USER);
const couchPassword = verifyConfig('couchPassword', process.env.COUCH_PASSWORD);

// Callbacks
const getID = verifyConfig('getID', null, true);
const getOwner = verifyConfig('getOwner', null, true);
const getEmpty = verifyConfig('getEmpty', null, true);
const parse = verifyConfig('parse', null, true);

let nano = require('nano')(couchURL);
let db;

debug('start process');

Promise.resolve()
    .then(authenticate)
    .then(checkDesignDoc)
    .then(getMetadata)
    .then(parseFile)
    .then(checkDocumentExists)
    .then(updateDocument)
    .then(function () {
        debug('finished');
    })
    .catch(function (err) {
        console.error(err.message || err);
        process.exit(1);
    });

function verifyConfig(name, defaultValue, mustBeFunction) {
    const value = config[name];
    if (value == undefined) {
        if (defaultValue) {
            return defaultValue;
        }
        throw new Error('missing configuration value: ' + name);
    }
    if (mustBeFunction && typeof value !== 'function') {
        throw new Error(`configuration value ${name} must be a function`);
    }
    return value;
}

function authenticate() {
    return new Promise(function (resolve, reject) {
        debug('authenticate');
        nano.auth(couchUser, couchPassword, function (err, body, headers) {
            if (err) return reject(err);
            if (headers && headers['set-cookie']) {
                nano = require('nano')({
                    url: couchURL,
                    cookie: headers['set-cookie']
                });
                db = nano.db.use(couchDB);
                resolve();
            } else {
                reject(new Error('authentication failure'));
            }
        });
    });
}

function checkDesignDoc() {
    return new Promise(function (resolve, reject) {
        debug('check design doc');
        db.get(constants.DESIGN_DOC_ID, function (err, result) {
            if (err) {
                if (err.statusCode === 404 && (err.reason === 'missing' || err.reason === 'deleted')) {
                    debug('design doc missing');
                    return resolve(createDesignDoc());
                }
                return reject(err);
            }
            if (result.version !== designDoc.version) {
                debug('design doc does not match');
                return resolve(createDesignDoc(result._rev));
            }
            resolve();
        });
    });
}

function createDesignDoc(revID) {
    return new Promise(function (resolve, reject) {
        debug('create design doc');
        if (revID) {
            designDoc._rev = revID;
        } else {
            delete designDoc._rev;
        }
        db.insert(designDoc, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function getMetadata() {
    debug('get metadata');
    const id = Promise.resolve(getID(filename, contents));
    const owner = Promise.resolve(getOwner(filename, contents));
    return Promise.all([id, owner]).then(function (result) {
        debug('id: ' + result[0]);
        debug('owner: ' + result[1]);
        if (typeof result[0] !== 'string' || typeof result[1] !== 'string') {
            throw new TypeError('id and owner must be strings');
        }
        if (!validateEmail(result[1])) {
            throw new Error('owner must be a valid email address');
        }
        return {id: result[0], owner: result[1]};
    });
}

function parseFile(info) {
    debug('parse file contents');
    return Promise.resolve(parse(filename, contents)).then(function (result) {
        if (typeof result.jpath !== 'string') {
            throw new Error('parse: jpath must be a string');
        }
        if (typeof result.data !== 'object' || result.data === null) {
            throw new Error('parse: data must be an object');
        }
        if (typeof result.type !== 'string') {
            throw new Error('parse: type must be a string');
        }

        debug('jpath: ' + result.jpath);
        info.jpath = result.jpath.split('.');
        info.data = result.data;
        info.content_type = result.content_type || 'application/octet-stream';
        info.type = result.type;
        return info;
    });
}

function checkDocumentExists(info) {
    return new Promise(function (resolve, reject) {
        debug('check that document exists');
        db.view(constants.DESIGN_DOC_NAME, 'byId', {key: info.id}, function (err, result) {
            if (err) return reject(err);
            const length = result.rows.length;
            if (length === 0) {
                return resolve(createDocument(info));
            }
            /*
             * TODO
             * If there are multiple rows, it means the data is spread across
             * multiple documents
             */
            debug(`found ${length} result(s)`);
            info._id = result.rows[0].id;
            resolve(info);
        });
    });
}

function createDocument(info) {
    return new Promise(function (resolve, reject) {
        debug('create document');
        const emptyDoc = getEmpty();
        emptyDoc.id = info.id;
        emptyDoc.owner = [info.owner];
        db.insert(emptyDoc, function (err, result) {
            if (err) return reject(err);
            info._id = result.id;
            resolve(info);
        });
    });
}

function updateDocument(info) {
    return new Promise(function (resolve, reject) {
        debug('update document');
        db.get(info._id, function (err, doc) {
            if (err) return reject(err);
            const jpath = info.jpath;
            const newData = info.data;
            let current = doc;
            for (var i = 0; i < jpath.length; i++) {
                current = current[jpath[i]];
                if (!current) {
                    return reject(new Error('jpath does not match document structure'));
                }
            }
            if (!Array.isArray(current)) {
                return reject(new Error('jpath must point to an array'));
            }
            current.push(newData);
            if (!newData.file) {
                newData.file = [];
            }
            newData.file.push({
                type: info.type,
                filename: filename
            });
            db.multipart.insert(doc, [{
                name: filename,
                data: contents,
                content_type: info.content_type
            }], doc._id, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}
