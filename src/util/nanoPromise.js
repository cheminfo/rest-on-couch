'use strict';

const constants = require('../constants');
const getConfig = require('../config/config').getConfig;

const debug = require('./debug')('nano');

const hasOwnProperty = Object.prototype.hasOwnProperty;

function authenticate(nano, user, password) {
  return new Promise((resolve, reject) => {
    debug.trace(`authenticate ${user} against CouchDB`);
    nano.auth(user, password, (err, body, headers) => {
      if (err) {
        debug.warn('auth failed');
        return reject(err);
      }
      if (headers && headers['set-cookie']) {
        debug.trace('auth success');
        return resolve(headers['set-cookie']);
      }
      return reject(new Error('cookie auth not supported'));
    });
  });
}

async function getDatabase(nano, database) {
  debug.trace(`getDatabase ${database}`);
  try {
    await nano.db.get(database);
    debug.trace('database exists');
    return true;
  } catch (err) {
    if (
      err.reason === 'no_db_file' /* couchdb 1.6 */ ||
      err.reason === 'Database does not exist.' /* couchdb 2.x.x */
    ) {
      debug.trace('database not found');
      return false;
    }
    debug.warn('getDatabase failed');
    throw err;
  }
}

async function createDatabase(nano, database) {
  debug.trace(`createDatabase ${database}`);
  try {
    await nano.db.create(database);
  } catch (err) {
    debug.warn('create failed');
    throw err;
  }
}

async function getDocument(db, docID, options) {
  options = options || {};
  debug.trace(`getDocument ${docID}`);
  cleanOptions(options);
  try {
    const result = await db.get(docID, options);
    debug.trace('found document');
    return result;
  } catch (err) {
    if (
      err.statusCode === 404 &&
      (err.reason === 'missing' || err.reason === 'deleted')
    ) {
      debug.trace('document missing');
      return null;
    }
    debug.warn('getDocument failed');
    throw err;
  }
}

async function insertDocument(db, doc) {
  debug.trace(`insertDocument with _id ${doc._id}`);
  const body = await db.insert(doc);
  debug.trace(`document inserted (${body.id})`);
  return body;
}

async function queryView(db, view, params, options) {
  options = options || {};
  params = params || {};
  if (!hasOwnProperty.call(params, 'reduce')) {
    params.reduce = false;
  }
  debug.trace(`queryView ${view}`);
  cleanOptions(params);
  var config = getConfig(db.config.db);
  var designDoc =
    (config.designDocNames && config.designDocNames[view]) ||
    constants.DESIGN_DOC_NAME;
  debug.trace(`designDoc: ${designDoc}`);
  const body = await db.view(designDoc, view, params);
  if (options.onlyValue) {
    return body.rows.map((row) => row.value);
  } else if (options.onlyDoc) {
    return body.rows.map((row) => row.doc);
  } else {
    return body.rows;
  }
}

function destroyDatabase(nano, dbName) {
  debug(`destroy database ${dbName}`);
  return nano.db.destroy(dbName);
}

async function destroyDocument(db, docId, revId) {
  debug.trace('destroy document');
  if (!revId) {
    const doc = await getDocument(db, docId);
    if (!doc || !doc._rev) return null;
    return destroyDocument(db, docId, doc._rev);
  }
  return db.destroy(docId, revId);
}

function updateWithHandler(db, update, docId, body) {
  debug.trace(`update with handler ${JSON.stringify(body)}`);
  return db.atomic(constants.DESIGN_DOC_NAME, update, docId, body);
}

function attachFiles(db, doc, files) {
  debug.trace('attach files');
  return db.multipart.insert(doc, files, doc._id);
}

function getAttachment(db, doc, name, asStream, options) {
  options = options || {};
  debug.trace(`get attachment ${doc}/${name}`);
  cleanOptions(options);
  if (asStream) {
    return db.attachment.getAsStream(doc, name, options);
  } else {
    return db.attachment.get(doc, name, options);
  }
}

function request(nano, options) {
  options = options || {};
  debug.trace('request');
  cleanOptions(options);
  return nano.request(options);
}

function cleanOptions(options) {
  if (options.token) {
    delete options.token;
  }
}

module.exports = {
  authenticate,
  getDatabase,
  createDatabase,
  getDocument,
  insertDocument,
  queryView,
  destroyDatabase,
  destroyDocument,
  updateWithHandler,
  attachFiles,
  getAttachment,
  request
};
