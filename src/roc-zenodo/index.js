'use strict';

const Zenodo = require('zenodo');

const getIndexMd = require('./getIndexMd');
const getZenodoDeposition = require('./getZenodoDeposition');
const createEntry = require('./createEntry');
const uploadFile = require('./uploadFile');

class RocZenodo {
  constructor(options = {}) {
    const {
      name,
      visualizationUrl,
      zenodoHost = 'sandbox.zenodo.org',
      zenodoToken
    } = options;
    if (typeof zenodoHost !== 'string') {
      throw new TypeError('zenodoHost must be a string');
    }
    if (typeof zenodoToken !== 'string') {
      throw new TypeError('zenodoToken must be a string');
    }
    if (typeof name !== 'string' || name === '') {
      throw new TypeError('name must be a string');
    }
    if (typeof visualizationUrl !== 'string') {
      throw new TypeError('visualizationUrl must be a string');
    }

    this.name = name;
    this.visualizationUrl = visualizationUrl;
    this.isSandbox = zenodoHost.includes('sandbox');
    this.zenodo = new Zenodo({ host: zenodoHost, token: zenodoToken });
  }

  getIndexMd(deposition) {
    return getIndexMd(deposition, this);
  }

  getZenodoDeposition(entry) {
    return getZenodoDeposition(entry, this);
  }

  createEntry(entry) {
    return createEntry(entry, this);
  }

  deleteEntry(deposition) {
    return this.zenodo.depositions.delete(deposition);
  }

  uploadFile(deposition, options) {
    return uploadFile(deposition, options, this);
  }

  publishEntry(deposition) {
    return this.zenodo.depositions.publish(deposition);
  }

  async getFileList(deposition) {
    const result = await this.zenodo.depositions.files(deposition);
    return result.data;
  }

  sortFiles(deposition, files) {
    return this.zenodo.depositions.sort({ id: deposition.id, data: files });
  }
}

module.exports = { RocZenodo };
