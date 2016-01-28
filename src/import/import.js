'use strict';

const fs = require('fs');
const path = require('path');

const Couch = require('../index');
const debug = require('../util/debug')('import');
const getConfig = require('../config/config').getConfig;


exports.import = function (database, importName, file) {
    debug(`import ${file} (${database}, ${importName})`);

    const filename = path.parse(file).base;
    const contents = fs.readFileSync(file);

    let config = getConfig(database);
    if (!config.import || !config.import[importName]) {
        throw new Error(`no import config for ${database}/${importName}`);
    }
    config = config.import[importName];

    const couch = Couch.get(database);

    // Callbacks
    const getID = verifyConfig('getID', null, true);
    const getOwner = verifyConfig('getOwner', null, true);
    const parse = verifyConfig('parse', null, true);

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

            debug.trace(`jpath: ${result.jpath}`);
            info.jpath = result.jpath.split('.');
            info.data = result.data;
            info.content_type = result.content_type || 'application/octet-stream';
            info.type = result.type;
            return info;
        });
    }

    function checkDocumentExists(info) {
        return couch.createEntry(info.id, info.owner, {
            createParameters: [filename, contents],
            kind: info.kind
        }).then(() => info);
    }

    function updateDocument(info) {
        return couch.addFileToJpath(info.id, info.owner, info.jpath, info.data, {
            type: info.type,
            name: filename,
            data: contents,
            content_type: info.content_type
        });
    }
};
