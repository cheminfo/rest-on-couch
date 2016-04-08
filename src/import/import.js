'use strict';

const fs = require('fs');
const path = require('path');

const Couch = require('../index');
const debug = require('../util/debug')('import');
const getConfig = require('../config/config').getConfig;


exports.import = function (database, importName, file) {
    debug(`import ${file} (${database}, ${importName})`);

    const filename = path.parse(file).base;
    let contents = fs.readFileSync(file);

    let config = getConfig(database);
    if (!config.import || !config.import[importName]) {
        throw new Error(`no import config for ${database}/${importName}`);
    }
    config = config.import[importName];

    const couch = Couch.get(database);

    // Callbacks
    const getID = verifyConfig('getID', null, true);
    const getOwner = verifyConfig('getOwner', null, true);
    let parse = null;
    let json = null;
    try {
        parse = verifyConfig('parse', null, true);
    } catch (e) {
        json = verifyConfig('json', null, true);
    }

    if (json) contents = JSON.parse(contents);

    return Promise.resolve()
        .then(getMetadata)
        .then(parseFile)
        .then(getKind)
        .then(checkDocumentExists)
        .then(updateDocument)
        .then(function () {
            debug.trace(`import ${file} success`);
            couch.log(`Import ${file} ok`, 'WARN');
        }).catch(function (e) {
            debug.error(`import ${file} failure: ${e.message}, ${e.stack}`);
            couch.log(`Import ${file} failed: ${e.message}`, 'ERROR');
            throw e;
        });

    function verifyConfig(name, defaultValue, mustBeFunction) {
        const value = config[name];
        if (value === undefined) {
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

    function getMetadata() {
        debug.trace('get metadata');
        const id = Promise.resolve(getID(filename, contents));
        const owner = Promise.resolve(getOwner(filename, contents));
        return Promise.all([id, owner]).then(function (result) {
            debug.trace(`id: ${result[0]}, owner: ${result[1]}`);
            return {id: result[0], owner: result[1]};
        });
    }

    function getKind(info) {
        debug.trace('getKind');
        if (!config.kind) return info;
        if (! (typeof config.kind === 'function')) {
            info.kind = config.kind;
            return info;
        }
        return Promise.resolve(config.kind(filename, contents)).then(function (kind) {
            info.kind = kind;
            return info;
        });
    }

    function parseFile(info) {
        debug.trace('parse file contents');
        if (parse) {
            return Promise.resolve(parse(filename, contents)).then(function (result) {
                if (typeof result.jpath !== 'string') {
                    throw new Error('parse: jpath must be a string');
                }
                if (typeof result.data !== 'object' || result.data === null) {
                    throw new Error('parse: data must be an object');
                }
                if (typeof result.field !== 'string') {
                    throw new Error('parse: field must be a string');
                }

                debug.trace(`jpath: ${result.jpath}`);
                info.jpath = result.jpath.split('.');
                info.data = result.data;
                info.content_type = result.content_type || 'application/octet-stream';
                info.field = result.field;
                return info;
            });
        } else if (json) {
            return Promise.resolve(json(filename, contents)).then(function (result) {
                info.data = result;
                return info;
            });
        }
    }

    function checkDocumentExists(info) {
        debug.trace('checkDocumentExists');
        return couch.createEntry(info.id, info.owner, {
            createParameters: [filename, contents],
            kind: info.kind
        }).then(docInfo => {
            return {
                info,
                docInfo
            };
        });
    }

    function updateDocument(info) {
        debug.trace('updateDocument');
        if (parse) {
            info = info.info;
            return couch.addFileToJpath(info.id, info.owner, info.jpath, info.data, {
                field: info.field,
                reference: info.reference,
                name: info.jpath.join('/') + '/' + filename,
                data: contents,
                content_type: info.content_type
            });
        }
        else if (json) {
            var entry = {};
            entry.$id = info.info.id;
            entry.$kind = config.kind;
            entry.$content = info.info.data;
            entry._id = info.docInfo.id;
            entry._rev = info.docInfo.rev;
            return couch.insertEntry(entry, info.info.owner, {
                merge: true
            });
        }
    }
};
