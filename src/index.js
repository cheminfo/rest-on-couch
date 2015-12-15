'use strict';

const debug = require('debug')('couch:rest');
const nano = require('nano');

const nanoPromise = require('./util/nanoPromise');

class Couch {
    constructor(options) {
        options = options || {};
        this._couchOptions = {
            url: options.couchUrl || process.env.REST_COUCH_URL || 'http://localhost:5984',
            database: options.couchDatabase || process.env.REST_COUCH_DATABASE,
            user: options.couchUser || process.env.REST_COUCH_USER,
            password: options.couchPassword || process.env.REST_COUCH_PASSWORD
        };
        this._nano = nano(this._couchOptions.url);
        this._db = null;
        this._lastAuth = 0;
        this._currentAuth = null;
        this._initPromise = null;
        this._init();
    }

    _init() {
        if (this._initPromise) {
            return this._initPromise;
        }
        debug('initialize');
        return this._initPromise = this._authenticate()
            .then(() => {
                return nanoPromise.getDatabase(nano, this._couchOptions.database)
                    .catch(err => {
                        console.log(err);
                    });
            })
    }

    _authenticate() {
        if (this._currentAuth) {
            return this._currentAuth;
        }
        if (!this._couchOptions.user) {
            debug('_authenticate: no user specified');
            return Promise.resolve();
        }
        return this._currentAuth = nanoPromise.authenticate(
            this._nano,
            this._couchOptions.user,
            this._couchOptions.password
        ).then(cookie => {
            this._nano = nano({
                url: this._couchOptions.url,
                cookie
            });
        });
    }
}

module.exports = Couch;
