'use strict';

const fs = require('fs');
const path = require('path');
const fold = require('fold-to-ascii').fold;

const Couch = require('../index');
const debug = require('../util/debug')('import');
const getConfig = require('../config/config').getConfig;

exports.import = async function (database, importName, file) {
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
    const getId = verifyConfig(config, 'getID', null, true);
    const getOwner = verifyConfig(config, 'getOwner', null, true);
    let parse = null;
    let json = null;
    try {
        parse = verifyConfig(config, 'parse', null, true);
    } catch (e) {
        json = verifyConfig(config, 'json', null, true);
    }

    if (json) contents = JSON.parse(contents);

    const info = {};
    try {
        await getMetadata(info, getId, getOwner, filename, contents, couch);
        await parseFile(info, parse, json, filename, contents, couch);
        if (config.kind) {
            await getKind(info, config.kind, filename, contents, couch);
        }
        const docInfo = await checkDocumentExists(info, filename, contents, couch);
        await updateDocument(info, docInfo, parse, json, filename, contents, couch);
        debug.trace(`import ${file} success`);
    } catch (e) {
        debug.error(`import ${file} failure: ${e.message}, ${e.stack}`);
        throw e;
    }

};

function verifyConfig(config, name, defaultValue, mustBeFunction) {
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

async function getMetadata(info, getId, getOwner, filename, contents, couch) {
    debug.trace('get metadata');
    let [id, owner] = await Promise.all([
        getId(filename, contents, couch),
        getOwner(filename, contents, couch)
    ]);
    debug.trace(`id: ${id}, owner: ${owner}`);
    let owners;
    if (Array.isArray(owner)) {
        owners = owner;
        owner = owners[0];
        owners = owners.slice(1);
    }
    info.id = id;
    info.owner = owner;
    info.owners = owners;
}

async function parseFile(info, parse, json, filename, contents, couch) {
    debug.trace('parse file contents');
    if (parse) {
        const result = await parse(filename, contents, couch);
        if (result.skip) {
            const error = new Error('skipped');
            error.skip = true;
            throw error;
        }
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
        info.reference = result.reference;
        info.content = result.content;
        if (result.noUpload) {
            info.noUpload = true;
        }
        info.attachments = result.attachments;
        return;
    } else if (json) {
        info.data = await json(filename, contents, couch);
        return;
    }
    throw new Error('unreachable');
}

async function getKind(info, kind, filename, contents, couch) {
    debug.trace('getKind');
    if (typeof kind !== 'function') {
        info.kind = kind;
    } else {
        info.kind = await kind(filename, contents, couch);
    }
}

async function checkDocumentExists(info, filename, contents, couch) {
    debug.trace('checkDocumentExists');
    return couch.createEntry(info.id, info.owner, {
        createParameters: [filename, contents],
        kind: info.kind,
        owners: info.owners
    });
}

async function updateDocument(info, docInfo, parse, json, filename, contents, couch) {
    debug.trace('updateDocument');
    if (parse) {
        const joined = info.jpath.join('/') + '/';
        if (!info.noUpload) {
            const goodFilename = fold(filename, '_');
            await couch.addFileToJpath(info.id, info.owner, info.jpath, info.data, {
                field: info.field,
                reference: info.reference,
                name: joined + goodFilename,
                data: contents,
                content_type: info.content_type
            }, info.content);
        } else {
            await updateContent();
        }
        if (info.attachments && info.attachments.length) {
            debug(`got ${info.attachments.length} more attachments`);
            if (!info.reference) throw new Error('cannot upload more attachments without a reference');
            for (const attachment of info.attachments) {
                if (!attachment.field ||
                    !attachment.filename ||
                    !attachment.contents ||
                    !attachment.content_type) {
                    throw new Error('attachment is missing a field');
                }
            }
            for (const attachment of info.attachments) {
                const attachmentName = fold(attachment.filename, '_');
                await couch.addFileToJpath(info.id, info.owner, info.jpath, attachment.data || {}, {
                    field: attachment.field,
                    reference: info.reference,
                    name: joined + attachmentName,
                    data: attachment.contents,
                    content_type: attachment.content_type
                });
            }
        }
        return null;
    } else if (json) {
        return updateContent();
    }
    throw new Error('unreachable');

    function updateContent() {
        let entry = {
            $id: info.id,
            $kind: info.kind,
            $content: info.data,
            _id: docInfo.id,
            _rev: docInfo.rev
        };
        return couch.insertEntry(entry, info.owner, {merge: true});
    }
}
