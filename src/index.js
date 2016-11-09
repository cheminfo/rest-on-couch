'use strict';

const debug = require('./util/debug')('main');
const nano = require('nano');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getConfig = require('./config/config').getConfig;

const attachMethods = require('./couch/attachment');
const entryMethods = require('./couch/entry');
const groupMethods = require('./couch/group');
const initMethods = require('./couch/init');
const logMethods = require('./couch/log');
const queryMethods = require('./couch/query');
const rightMethods = require('./couch/right');
const tokenMethods = require('./couch/token');
const userMethods = require('./couch/user');

process.on('unhandledRejection', function (err) {
    debug.error('unhandled rejection: ' + err.stack);
});

const basicRights = {
    $type: 'db',
    _id: constants.RIGHTS_DOC_ID,
    createGroup: [],
    create: [],
    read: []
};

const defaultRights = {
    read: ['anonymous']
};

class Couch {
    constructor(options) {
        let database;
        if (typeof options === 'string') {
            database = options;
        } else if (options != null) {
            database = options.database;
        }

        if (!database) {
            throw new CouchError('database option is mandatory');
        }
        if (database.startsWith('_')) {
            throw new CouchError('database name cannot start with an underscore');
        }

        this._databaseName = database;

        const config = getConfig(database, options);

        this._couchOptions = {
            url: config.url,
            database,
            username: config.username,
            password: config.password,
            autoCreate: config.autoCreateDatabase
        };

        this._logLevel = logMethods.getLevel(config.logLevel);

        this._customDesign = config.customDesign || {};
        this._viewsWithOwner = new Set();
        if (this._customDesign.views) {
            for (const i in this._customDesign.views) {
                if (this._customDesign.views[i].withOwner) {
                    this._viewsWithOwner.add(i);
                }
            }
        }

        this._defaultEntry = config.defaultEntry || getDefaultEntry;
        this._rights = Object.assign({}, basicRights, config.rights || defaultRights);

        this._nano = nano(this._couchOptions.url);
        this._db = null;
        this._lastAuth = 0;
        this._initPromise = null;
        this._currentAuth = null;
        this._authRenewal = null;
        this._authRenewalInterval = config.authRenewal;
        this.open().catch(() => {});
    }

    async open() {
        if (this._initPromise) {
            return this._initPromise;
        }
        return this._initPromise = this.getInitPromise();
    }

    close() {
        clearInterval(this._authRenewal);
    }
}

const databaseCache = new Map();

Couch.get = function (databaseName) {
    if (typeof databaseName !== 'string') {
        throw new TypeError('database name must be a string');
    }
    if (databaseCache.has(databaseName)) {
        return databaseCache.get(databaseName);
    } else {
        const db = new Couch(databaseName);
        databaseCache.set(databaseName, db);
        return db;
    }
};

function extendCouch(methods) {
    for (const method in methods) {
        Couch.prototype[method] = methods[method];
    }
}

extendCouch(attachMethods.methods);
extendCouch(entryMethods.methods);
extendCouch(groupMethods.methods);
extendCouch(initMethods.methods);
extendCouch(logMethods.methods);
extendCouch(queryMethods.methods);
extendCouch(rightMethods.methods);
extendCouch(tokenMethods.methods);
extendCouch(userMethods.methods);

module.exports = Couch;

function getDefaultEntry() {
    return {};
}
