'use strict';

const Zenodo = require('zenodo');

const getZenodoDeposition = require('./getZenodoDeposition');

class RocZenodo {
  constructor(options = {}) {
    const {
      name,
      visualizationUrl,
      attachments,
      sandbox = true,
      token
    } = options;
    if (typeof sandbox !== 'boolean') {
      throw new TypeError('sandbox must be a boolean');
    }
    const host = sandbox ? 'sandbox.zenodo.org' : 'www.zenodo.org';
    if (typeof token !== 'string') {
      throw new TypeError('token must be a string');
    }
    if (typeof name !== 'string' || name === '') {
      throw new TypeError('name must be a string');
    }
    if (
      visualizationUrl !== undefined &&
      typeof visualizationUrl !== 'string'
    ) {
      throw new TypeError('visualizationUrl must be a string');
    }
    if (attachments !== undefined && typeof attachments !== 'function') {
      throw new TypeError('attachments must be a function');
    }

    this.name = name;
    this.visualizationUrl = visualizationUrl;
    this.attachments = attachments;
    this.isSandbox = sandbox;
    this.zenodo = new Zenodo({ host, token });
  }

  getDescriptionSuffix(deposition) {
    if (!this.visualizationUrl) return '';
    let url = `${this.visualizationUrl}/${deposition.id}`;
    if (this.isSandbox) {
      url += '?sandbox=1';
    }
    return `
      <br />
      <br />
      <p>
        Visualize the data for this publication: <a href="${url}" target="_blank">open entry</a>
      </p>`;
  }

  getIndexMd(readme) {
    return {
      filename: '_README.md',
      contentType: 'text/markdown',
      data: readme
    };
  }

  getZenodoDeposition(entry) {
    return getZenodoDeposition(entry, this);
  }

  // entry is the $content.meta of the ROC entry
  async createEntry(entry) {
    if (!entry.metadata) {
      entry = this.getZenodoDeposition(entry);
    }
    const deposition = await this.zenodo.depositions.create(entry);
    return deposition.data;
  }

  updateEntry(deposition) {
    return this.zenodo.depositions.update(deposition);
  }

  deleteEntry(deposition) {
    return this.zenodo.depositions.delete(deposition);
  }

  async uploadFile(deposition, options) {
    // deposition is the object returned by createEntry
    const zFiles = this.zenodo.files;
    const result = await zFiles.upload(Object.assign({ deposition }, options));
    return result.data;
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
