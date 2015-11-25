#!/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('couch-import');
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
const getID = verifyConfig('getID', true);
const getOwner = verifyConfig('getOwner', true);
const getEmpty = verifyConfig('getEmpty', true);
const parse = verifyConfig('parse', true);

let nano = require('nano')(couchURL);
let db;

debug('start process');

Promise.resolve()
    .then(authenticate)
    .then(checkDesignDoc)
    // add steps here
    .then(function () {
        debug('finished');
    })
    .catch(function (err) {
        console.error(err);
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
                debug('design doc outdated');
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
