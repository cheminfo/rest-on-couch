import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

import Couch from '../couch/index.js';

const kFilePath = Symbol('filePath');
const kContents = Symbol('contents');
const kDB = Symbol('db');

export default class ImportContext {
  constructor(filePath, database) {
    this[kFilePath] = filePath;
    this[kContents] = {};
    this[kDB] = database;
  }

  static getSource() {
    return [];
  }

  get filename() {
    return path.parse(this[kFilePath]).base;
  }

  get fileDir() {
    return path.parse(this[kFilePath]).dir;
  }

  get fileExt() {
    return path.parse(this[kFilePath]).ext;
  }

  get couch() {
    return Couch.get(this[kDB]);
  }

  async getContents(encoding = null, cache = true) {
    if (cache) {
      if (!this[kContents][encoding]) {
        this[kContents][encoding] = await fs.readFile(
          this[kFilePath],
          encoding,
        );
      }
      return this[kContents][encoding];
    } else {
      return fs.readFile(this[kFilePath], encoding);
    }
  }

  getContentsSync(encoding = null, cache = true) {
    if (cache) {
      if (!this[kContents][encoding]) {
        this[kContents][encoding] = fsSync.readFileSync(
          this[kFilePath],
          encoding,
        );
      }
      return this[kContents][encoding];
    } else {
      return fsSync.readFileSync(this[kFilePath], encoding);
    }
  }
}
