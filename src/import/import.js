'use strict';

const fs = require('fs');
const path = require('path');
const fold = require('fold-to-ascii').fold;

const Couch = require('../index');
const debug = require('../util/debug')('import');
const getConfig = require('../config/config').getConfig;

exports.import = async function (database, importName, file, options) {
    debug(`import ${file} (${database}, ${importName})`);

    options = options || {};
    const dryRun = !!options.dryRun;

    const parsedFilename = path.parse(file);
    const filedir = parsedFilename.dir;
    const filename = parsedFilename.base;
    let config = getConfig(database);
    const couch = Couch.get(database);
    try {
        // Give an opportunity to ignore before even reading the file
        const shouldIgnore = verifyConfig(config, 'shouldIgnore', null, true);
        const ignore = await shouldIgnore(filename, couch, filedir);
        if (ignore) {
            debug.debug(`Ignore file ${file}`);
            return;
        }
    } catch (e) {
        // Throw if abnormal error
        if (!e.message.match('missing configuration value')) {
            throw e;
        }
        // Go on normally if this configuration is missing
    }

    let contents = fs.readFileSync(file);

    if (!config.import || !config.import[importName]) {
        throw new Error(`no import config for ${database}/${importName}`);
    }
    config = config.import[importName];

    const info = {};

    let isParse = false;
    let isJson = false;

    if (typeof config.fullProcess === 'function') {
        isParse = true;
        await fullyProcessResult(info, config.fullProcess, filename, contents, couch, filedir);
    } else {
        // Callbacks
        const getId = verifyConfig(config, 'getID', null, true);
        const getOwner = verifyConfig(config, 'getOwner', null, true);
        let parse = null;
        let json = null;
        try {
            parse = verifyConfig(config, 'parse', null, true);
            isParse = true;
        } catch (e) {
            json = verifyConfig(config, 'json', null, true);
            isJson = true;
        }

        if (json) contents = JSON.parse(contents);

        await getMetadata(info, getId, getOwner, filename, contents, couch, filedir);
        await parseFile(info, parse, json, filename, contents, couch, filedir);
        if (config.kind) {
            await getKind(info, config.kind, filename, contents, couch, filedir);
        }
    }

    if (dryRun) return;

    try {
        const docInfo = await checkDocumentExists(info, filename, contents, couch);
        await updateDocument(info, docInfo, isParse, isJson, filename, contents, couch);
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
        throw new Error(`missing configuration value: ${name}`);
    }
    if (mustBeFunction && typeof value !== 'function') {
        throw new Error(`configuration value ${name} must be a function`);
    }
    return value;
}

async function getMetadata(info, getId, getOwner, filename, contents, couch, filedir) {
    debug.trace('get metadata');
    let [id, owner] = await Promise.all([
        getId(filename, contents, couch, filedir),
        getOwner(filename, contents, couch, filedir)
    ]);
    debug.trace(`id: ${id}, owner: ${owner}`);
    const ownerData = getOwnerData(owner);
    info.id = id;
    info.owner = ownerData.owner;
    info.owners = ownerData.owners;
}

async function parseFile(info, parse, json, filename, contents, couch, filedir) {
    debug.trace('parse file contents');
    if (parse) {
        const result = await parse(filename, contents, couch, filedir);
        fillInfoWithResult(info, result);
        return;
    } else if (json) {
        info.data = await json(filename, contents, couch, filedir);
        return;
    }
    throw new Error('unreachable');
}

async function getKind(info, kind, filename, contents, couch, filedir) {
    debug.trace('getKind');
    if (typeof kind !== 'function') {
        info.kind = kind;
    } else {
        info.kind = await kind(filename, contents, couch, filedir);
    }
}

async function fullyProcessResult(info, fullProcess, filename, contents, couch, filedir) {
    const result = await fullProcess(filename, contents, couch, filedir);

    if (!result.id) {
        throw new Error('missing id');
    }
    info.id = result.id;

    if (!result.owner) {
        throw new Error('missing owner');
    }
    const ownerData = getOwnerData(result.owner);
    info.owner = ownerData.owner;
    info.owners = ownerData.owners;

    fillInfoWithResult(info, result);

    if (!result.kind) {
        throw new Error('missing kind');
    }
    info.kind = result.kind;
}

function fillInfoWithResult(info, result) {
    if (result.skip) {
        const error = new Error('skipped');
        error.skip = true;
        throw error;
    }
    if (typeof result.jpath !== 'string' && typeof result.jpath !== 'undefined') {
        throw new Error('parse: jpath must be a string');
    }
    if (typeof result.data !== 'object' || result.data === null) {
        throw new Error('parse: data must be an object');
    }
    if (typeof result.field !== 'string' && typeof result.field !== 'undefined') {
        throw new Error('parse: field must be a string');
    }

    debug.trace(`jpath: ${result.jpath}`);
    if (result.jpath) info.jpath = result.jpath.split('.');
    info.data = result.data;
    info.content_type = result.content_type || 'application/octet-stream';
    info.field = result.field;
    info.reference = result.reference;
    info.content = result.content;
    info.noUpload = !!result.noUpload;
    info.attachments = result.attachments;
}

async function checkDocumentExists(info, filename, contents, couch) {
    debug.trace('checkDocumentExists');
    return couch.createEntry(info.id, info.owner, {
        createParameters: [filename, contents],
        kind: info.kind,
        owners: info.owners
    });
}

async function updateDocument(info, docInfo, isParse, isJson, filename, contents, couch) {
    debug.trace('updateDocument');
    if (isParse) {
        const joined = info.jpath ? `${info.jpath.join('/')}/` : '';
        if (!info.noUpload && info.jpath) {
            const goodFilename = fold(filename, '_');
            await couch.addFileToJpath(info.id, info.owner, info.jpath, info.data, {
                field: info.field,
                reference: info.reference,
                name: joined + goodFilename,
                data: contents,
                content_type: info.content_type
            }, info.content);
        } else if (info.jpath) {
            await couch.addFileToJpath(info.id, info.owner, info.jpath, info.data, {reference: info.reference}, info.content, true);
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
    } else if (isJson) {
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

function getOwnerData(owner) {
    let owners;
    if (Array.isArray(owner)) {
        owners = owner;
        owner = owners[0];
        owners = owners.slice(1);
    }
    return {owner, owners};
}
