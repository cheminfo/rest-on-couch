'use strict';

const CouchError = require('../util/CouchError');
const debug = require('../util/debug')('main:imports');

const validateMethods = require('./validate');

const methods = {
  async logImport(toLog) {
    await this.open();
    toLog.$type = 'import';
    toLog.$creationDate = Date.now();
    await this._db.insertDocument(toLog);
  },

  async getImports(user, query) {
    await this.open();
    debug('get imports (%s)', user);

    const hasRight = await validateMethods.checkRightAnyGroup(
      this,
      user,
      'readImport',
    );
    if (!hasRight) {
      throw new CouchError(
        'user is missing read right on imports',
        'unauthorized',
      );
    }

    const imports = await this._db.queryView(
      'importsByDate',
      {
        descending: true,
        include_docs: true,
        limit: query.limit || 10,
        skip: query.skip || 0,
      },
      { onlyDoc: true },
    );

    return imports;
  },

  async getImport(user, uuid) {
    await this.open();
    debug('get import (%s, %s)', user, uuid);

    const hasRight = await validateMethods.checkRightAnyGroup(
      this,
      user,
      'readImport',
    );
    if (!hasRight) {
      throw new CouchError(
        'user is missing read right on imports',
        'unauthorized',
      );
    }

    const doc = await this._db.getDocument(uuid);
    if (!doc) {
      throw new CouchError('document not found', 'not found');
    }
    if (doc.$type !== 'import') {
      throw new CouchError(
        `wrong document type: ${doc.$type}. Expected: import`,
      );
    }

    return doc;
  },
};

module.exports = {
  methods,
};
