'use strict';

const crypto = require('crypto');
const http = require('http');

const got = require('got');

const { DESIGN_DOC_NAME } = require('../constants');
const getConfig = require('../config/config').getConfig;

const debug = require('./debug')('nanoShim');
const CouchError = require('./CouchError');

const hasOwnProperty = Object.prototype.hasOwnProperty;

class NanoShim {
  constructor(url, cookie) {
    const agent = new http.Agent({
      timeout: 1000 * 60 * 5
    });
    this.client = got.extend({
      baseUrl: url,
      json: true,
      headers: {
        cookie
      },
      agent
    });
  }

  useDb(dbName) {
    dbName = cleanDbName(dbName);
    const client = this.client.extend({
      baseUrl: this.client.defaults.options.baseUrl + dbName
    });
    return new NanoDbShim(dbName, client);
  }

  async hasDatabase(dbName) {
    dbName = cleanDbName(dbName);
    debug.trace('hasDatabase', dbName);
    try {
      await this.client.get(dbName);
      debug.trace('database exists');
      return true;
    } catch (err) {
      if (
        err.body &&
        (err.body.reason === 'no_db_file' /* couchdb 1.6 */ ||
          err.body.reason === 'Database does not exist.') /* couchdb 2.x.x */
      ) {
        debug.trace('database not found');
        return false;
      }
      debug.warn('hasDatabase failed');
      throw err;
    }
  }

  async createDatabase(dbName) {
    dbName = cleanDbName(dbName);
    debug.trace('createDatabase', dbName);
    try {
      await this.client.put(dbName);
    } catch (err) {
      debug.warn('create failed');
      throw err;
    }
  }

  destroyDatabase(dbName) {
    dbName = cleanDbName(dbName);
    debug('destroy database', dbName);
    return this.client.delete(dbName);
  }

  async request(options) {
    debug.trace('request');
    const { method = 'GET', db, doc, body } = options;
    const query = prepareQuery(options.query);
    let url = '';
    if (db) url += cleanDbName(db);
    if (doc) url += `/${cleanDocId(doc)}`;
    return this.client(url, {
      method,
      query,
      body
    });
  }
}

class NanoDbShim {
  constructor(dbName, client) {
    this.dbName = dbName;
    this.client = client;
  }

  async insertDocument(doc) {
    debug.trace('insertDocument with _id %s', doc._id);
    let options;
    if (doc._id && doc._id.startsWith('_design')) {
      options = {
        json: false,
        body: JSON.stringify(doc, stringifyFunctions),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        }
      };
    } else {
      options = { body: doc };
    }
    try {
      const response = await this.client.post('/', options);
      debug.trace('document inserted', response.body.id);
      return response.body;
    } catch (e) {
      debug.trace('document insert failed', doc._id);
      if (e.body && e.body.error) {
        throw new CouchError(e.body.reason, e.body.error);
      } else {
        throw e;
      }
    }
  }

  async getDocument(docId, query) {
    docId = cleanDocId(docId);
    query = prepareQuery(query);
    debug.trace('getDocument', docId);
    try {
      const result = await this.client.get(docId, { query });
      debug.trace('found document');
      return result.body;
    } catch (err) {
      if (
        err.statusCode === 404 &&
        (err.body.reason === 'missing' || err.body.reason === 'deleted')
      ) {
        debug.trace('document missing');
        return null;
      }
      debug.warn('getDocument failed');
      throw err;
    }
  }

  async destroyDocument(docId, rev) {
    docId = cleanDocId(docId);
    debug.trace('destroy document');
    if (!rev) {
      const doc = await this.getDocument(docId);
      if (!doc || !doc._rev) return null;
      rev = doc._rev;
    }
    return this.client.delete(docId, { query: { rev } });
  }

  async queryView(view, query, options = {}) {
    query = prepareQuery(query);
    prepareQueryForView(query);
    if (!hasOwnProperty.call(query, 'reduce')) {
      query.reduce = false;
    }
    debug.trace('queryView', view);
    var config = getConfig(this.dbName);
    var designDoc =
      (config.designDocNames && config.designDocNames[view]) || DESIGN_DOC_NAME;
    debug.trace('designDoc', designDoc);
    const viewPath = `_design/${designDoc}/_view/${view}`;
    const { body } = await this.client.get(viewPath, { query });
    if (options.onlyValue) {
      return body.rows.map((row) => row.value);
    } else if (options.onlyDoc) {
      return body.rows.map((row) => row.doc);
    } else {
      return body.rows;
    }
  }

  async updateWithHandler(update, docId, requestBody) {
    debug.trace('update with handler', docId, body);
    docId = cleanDocId(docId);
    const viewPath = `_design/${DESIGN_DOC_NAME}/_update/${update}/${docId}`;
    const { body } = await this.client.post(viewPath, { requestBody });
    return body;
  }

  async getAttachment(docId, attName, asStream, query) {
    docId = cleanDocId(docId);
    query = prepareQuery(query);
    debug.trace('get attachment', docId, attName);
    const attachmentPath = `${docId}/${attName}`;
    if (asStream) {
      return this.client.get(attachmentPath, {
        json: false,
        query,
        stream: true,
        encoding: null,
        decompress: false
      });
    } else {
      const response = await this.client.get(attachmentPath, {
        json: false,
        query,
        encoding: null
      });
      return response.body;
    }
  }

  // multipart body created based on http://docs.couchdb.org/en/stable/api/document/common.html
  attachFiles(doc, attachments, query) {
    debug.trace('attach files');
    doc = Object.assign({ _attachments: {} }, doc);
    query = prepareQuery(query);
    const docId = cleanDocId(doc._id);
    const boundary = getBoundary();
    const prefixedBoundary = Buffer.from(`\n--${boundary}`);
    const multipart = [];
    for (const att of attachments) {
      doc._attachments[att.name] = {
        follows: true,
        length: att.data.length,
        content_type: att.content_type
      };
      multipart.push(
        Buffer.from('\n'),
        Buffer.from(att.data),
        prefixedBoundary,
        Buffer.from('\n')
      );
    }
    multipart.unshift(
      prefixedBoundary,
      Buffer.from('Content-Type: application/json\n\n'),
      Buffer.from(JSON.stringify(doc)),
      prefixedBoundary
    );
    multipart.push(Buffer.from('--'));
    return this.client.put(docId, {
      json: false,
      body: Buffer.concat(multipart),
      query,
      headers: {
        accept: 'application/json',
        'content-type': `multipart/related;boundary="${boundary}"`
      }
    });
  }
}

function cleanDbName(dbName) {
  return encodeURIComponent(dbName);
}

function cleanDocId(docId) {
  if (!/^_design/.test(docId)) {
    return encodeURIComponent(docId);
  } else {
    return docId;
  }
}

const specialKeys = [
  'startkey',
  'endkey',
  'key',
  'keys',
  'start_key',
  'end_key'
];
function prepareQuery(query) {
  if (!query) return {};
  query = Object.assign({}, query);
  if (query.token) {
    delete query.token;
  }
  specialKeys.forEach(function (key) {
    if (key in query) {
      query[key] = JSON.stringify(query[key]);
    }
  });
  return query;
}

const paramsToEncode = ['counts', 'drilldown', 'group_sort', 'ranges', 'sort'];
function prepareQueryForView(query) {
  paramsToEncode.forEach(function (param) {
    if (param in query) {
      if (typeof query[param] !== 'string') {
        query[param] = JSON.stringify(query[param]);
      } else {
        try {
          JSON.parse(query[param]);
        } catch (e) {
          query[param] = JSON.stringify(query[param]);
        }
      }
    }
  });
}

function getBoundary() {
  return crypto.randomBytes(24).toString('hex');
}

function stringifyFunctions(key, value) {
  if (typeof value === 'function') {
    return value.toString();
  } else {
    return value;
  }
}

async function getNano(url, username, password) {
  const response = await got.post(`${url}/_session`, {
    json: true,
    body: {
      name: username,
      password
    }
  });
  const headers = response.headers;
  if (!headers['set-cookie']) {
    throw new Error('unexpected: set-cookie header should be present');
  }
  const cookie = headers['set-cookie'][0].split(';')[0];
  return new NanoShim(url, cookie);
}

module.exports = getNano;
