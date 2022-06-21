'use strict';

const crypto = require('crypto');
const http = require('http');

const got = require('got');

const getConfig = require('../config/config').getConfig;
const { DESIGN_DOC_NAME } = require('../constants');

const CouchError = require('./CouchError');
const debug = require('./debug')('nanoShim');

const hasOwnProperty = Object.prototype.hasOwnProperty;

const CRLF = Buffer.from('\r\n', 'utf8');
const CRLFCRLF = Buffer.from('\r\n\r\n', 'utf8');
const MIMETYPE = Buffer.from(
  '\r\nContent-Type: application/json\r\n\r\n',
  'utf8',
);
const ENDBOUNDARY = Buffer.from('--', 'utf8');

class NanoShim {
  constructor(url, cookie) {
    const agent = new http.Agent({
      timeout: 1000 * 60 * 5,
    });
    if (!url.endsWith('/')) {
      url += '/';
    }
    this.options = {
      prefixUrl: url,
      responseType: 'json',
      headers: {
        cookie,
      },
      timeout: {
        request: 60000,
      },
      agent: {
        http: agent,
      },
    };
    this.client = got.extend(this.options);
  }

  useDb(dbName) {
    dbName = cleanDbName(dbName);
    const client = got.extend({
      ...this.options,
      prefixUrl: this.options.prefixUrl + dbName,
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
        err.response.body &&
        (err.response.body.reason === 'no_db_file' /* couchdb 1.6 */ ||
          err.response.body.reason ===
            'Database does not exist.') /* couchdb 2.x.x */
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
    const searchParams = prepareSearchParams(options.searchParams);
    let url = '';
    if (db) url += cleanDbName(db);
    if (doc) url += `/${doc}`;
    return this.client(url, {
      method,
      searchParams,
      json: body,
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
        body: JSON.stringify(doc, stringifyFunctions),
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
      };
    } else {
      options = { json: doc };
    }
    try {
      const response = await this.client.post(options);
      debug.trace('document inserted', response.body.id);
      return response.body;
    } catch (e) {
      debug.trace('document insert failed', doc._id);
      if (e.response.body && e.response.body.error) {
        throw new CouchError(e.response.body.reason, e.response.body.error);
      } else {
        throw e;
      }
    }
  }

  async getDocument(docId, searchParams) {
    searchParams = prepareSearchParams(searchParams);
    debug.trace('getDocument', docId);
    try {
      const result = await this.client.get(docId, { searchParams });
      debug.trace('found document');
      return result.body;
    } catch (err) {
      if (
        err.response.statusCode === 404 &&
        (err.response.body.reason === 'missing' ||
          err.response.body.reason === 'deleted')
      ) {
        debug.trace(`document missing ${docId}`);
        return null;
      }
      debug.error('getDocument failed', err.message);
      throw err;
    }
  }

  async destroyDocument(docId, rev) {
    debug.trace('destroy document');
    if (!rev) {
      const doc = await this.getDocument(docId);
      if (!doc || !doc._rev) return null;
      rev = doc._rev;
    }
    return this.client.delete(docId, { searchParams: { rev } });
  }

  async createIndex(index) {
    debug.trace('createIndex %s', index.name);
    index.index.partial_filter_selector = {
      ...index.index.partial_filter_selector,
      '\\$type': {
        $eq: 'entry',
      },
    };
    const { body } = await this.client.post('_index', {
      json: index,
    });
    if (body.result === 'created') {
      debug.trace('index %s created / updated', index.name);
    } else {
      debug.trace('index %s has not changed', index.name);
    }
  }

  async deleteIndex(designDoc, name) {
    debug.trace('deleteIndex (%s, %s)', designDoc, name);
    await this.client.delete(`_index/${designDoc}/json/${name}`);
  }

  async getDesignDocs() {
    debug.trace('getDesignDocs');
    const searchParams = new URLSearchParams();
    searchParams.set('include_docs', true);
    const { body } = await this.client.get('_design_docs', {
      searchParams,
    });
    const designDocs = body.rows.map((row) => row.doc);
    return designDocs;
  }

  queryMangoStream(query) {
    configureIndex(this, query);
    return this.client.stream.post('_find', {
      json: query,
    });
  }

  async queryMango(query) {
    configureIndex(this, query);

    const { body } = await this.client.post('_find', {
      json: query,
    });
    return body;
  }

  async queryView(view, searchParams, options = {}) {
    searchParams = prepareSearchParams(searchParams);
    prepareSearchParamsForView(searchParams);
    if (!hasOwnProperty.call(searchParams, 'reduce')) {
      searchParams.reduce = false;
    }
    debug.trace('queryView', view);
    var config = getConfig(this.dbName);
    var designDoc =
      (config.designDocNames && config.designDocNames[view]) || DESIGN_DOC_NAME;
    debug.trace('designDoc', designDoc);
    const viewPath = `_design/${designDoc}/_view/${view}`;
    const { body } = await this.client.get(viewPath, { searchParams });
    if (options.onlyValue) {
      return body.rows.map((row) => row.value);
    } else if (options.onlyDoc) {
      return body.rows.map((row) => row.doc);
    } else {
      return body.rows;
    }
  }

  async updateWithHandler(update, docId, requestBody) {
    debug.trace('update with handler', docId, requestBody);
    const viewPath = `_design/${DESIGN_DOC_NAME}/_update/${update}/${docId}`;
    const { body } = await this.client.post(viewPath, { json: requestBody });
    return body;
  }

  async getAttachment(docId, attName, asStream, searchParams) {
    debug.trace('get attachment', docId, attName);
    attName = encodeURIComponent(attName);
    searchParams = prepareSearchParams(searchParams);
    const attachmentPath = `${docId}/${attName}`;
    if (asStream) {
      return this.client.get(attachmentPath, {
        searchParams,
        responseType: 'buffer',
        isStream: true,
        decompress: false,
      });
    } else {
      const response = await this.client.get(attachmentPath, {
        searchParams,
        responseType: 'buffer',
      });
      return response.body;
    }
  }

  // multipart body created based on http://docs.couchdb.org/en/stable/api/document/common.html
  attachFiles(doc, attachments, searchParams) {
    debug.trace('attach files');
    doc = Object.assign({ _attachments: {} }, doc);
    searchParams = prepareSearchParams(searchParams);
    const boundary = getBoundary();
    const prefixedBoundary = Buffer.from(`--${boundary}`, 'utf8');
    const multipart = [];
    for (const att of attachments) {
      doc._attachments[att.name] = {
        follows: true,
        content_type: att.content_type,
        length: att.data.length,
      };
      multipart.push(CRLFCRLF, att.data, CRLF, prefixedBoundary);
    }
    const docString = JSON.stringify(doc);
    multipart.unshift(
      prefixedBoundary,
      MIMETYPE,
      Buffer.from(docString, 'utf8'),
      CRLF,
      prefixedBoundary,
    );
    multipart.push(ENDBOUNDARY);

    return this.client.put(doc._id, {
      searchParams,
      body: Buffer.concat(multipart),
      headers: {
        accept: 'application/json',
        'content-type': `multipart/related;boundary="${boundary}"`,
      },
    });
  }
}

function cleanDbName(dbName) {
  return encodeURIComponent(dbName);
}

const specialKeys = [
  'startkey',
  'endkey',
  'key',
  'keys',
  'start_key',
  'end_key',
];

function prepareSearchParams(searchParams) {
  if (!searchParams) return {};
  searchParams = Object.assign({}, searchParams);
  if (searchParams.token) {
    delete searchParams.token;
  }
  specialKeys.forEach(function (key) {
    if (key in searchParams) {
      searchParams[key] = JSON.stringify(searchParams[key]);
    }
  });
  return searchParams;
}

const paramsToEncode = ['counts', 'drilldown', 'group_sort', 'ranges', 'sort'];

function prepareSearchParamsForView(searchParams) {
  paramsToEncode.forEach(function (param) {
    if (param in searchParams) {
      if (typeof searchParams[param] !== 'string') {
        searchParams[param] = JSON.stringify(searchParams[param]);
      } else {
        try {
          JSON.parse(searchParams[param]);
        } catch (e) {
          searchParams[param] = JSON.stringify(searchParams[param]);
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
    responseType: 'json',
    json: {
      name: username,
      password,
    },
  });
  const headers = response.headers;
  if (!headers['set-cookie']) {
    throw new Error('unexpected: set-cookie header should be present');
  }
  const cookie = headers['set-cookie'][0].split(';')[0];
  return new NanoShim(url, cookie);
}

function configureIndex(ctx, query) {
  const indexName = query.use_index;
  if (indexName) {
    var config = getConfig(ctx.dbName);
    const designDoc = config.designDocNames?.[indexName];
    if (!designDoc) {
      throw new CouchError(`index ${indexName} does not exist`, 'bad request');
    }
    query.use_index = `${designDoc}/${indexName}`;
  }
}

module.exports = getNano;
