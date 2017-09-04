'use strict';

const debug = require('./util/debug')('main');

const CouchError = require('./util/CouchError');
const constants = require('./constants');
const getConfig = require('./config/config').getConfig;
const log = require('./couch/log');

process.on('unhandledRejection', function (err) {
    debug.error(`unhandled rejection: ${err.stack}`);
});

const basicRights = {
    $type: 'db',
    _id: constants.RIGHTS_DOC_ID,
    createGroup: [],
    create: [],
    read: []
};

const databaseCache = new Map();

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
            throw new CouchError('invalid database name');
        }

        this._databaseName = database;

        const config = getConfig(database, options);

        this._couchOptions = {
            url: config.url,
            database,
            username: config.username,
            password: config.password,
            autoCreate: config.autoCreateDatabase,
            ldapGroupsRenewal: config.ldapGroupsRenewal,
            ldapBindDN: config.ldapBindDN,
            ldapBindPassword: config.ldapBindPassword,
            ldapSync: config.ldapSync
        };

        this._logLevel = log.getLevel(config.logLevel);

        this._customDesign = config.customDesign || {};
        this._viewsWithOwner = new Set();
        if (this._customDesign.views) {
            for (const i in this._customDesign.views) {
                if (this._customDesign.views[i].withOwner) {
                    this._viewsWithOwner.add(i);
                }
            }
        }

        this._getUserInfo = config.getUserInfo;

        this._defaultEntry = config.defaultEntry || getDefaultEntry;
        this._rights = Object.assign({}, basicRights, config.rights);
        this._administrators = config.administrators || [];
        this._superAdministrators = config.superAdministrators || [];

        this[constants.kEntryUnicity] = config.entryUnicity || 'byOwner';

        this._nano = null;
        this._db = null;
        this._initPromise = null;
        this.open().catch(() => {
            // empty
        });
    }

    static get(databaseName) {
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
    }
}

extendCouch('attachment');
extendCouch('doc');
extendCouch('entry');
extendCouch('group');
extendCouch('init');
extendCouch('log');
extendCouch('query');
extendCouch('right');
extendCouch('token');
extendCouch('user');

module.exports = Couch;

function extendCouch(name) {
    const methods = require(`./couch/${name}`).methods;
    for (const method in methods) {
        Couch.prototype[method] = methods[method];
    }
}

function getDefaultEntry() {
    return {};
}
