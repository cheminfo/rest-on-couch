'use strict';

const fs = require('fs-promise');
const path = require('path');

const Couch = require('..');

const kFilePath = Symbol('filePath');
const kContents = Symbol('contents');
const kDB = Symbol('db');
const kSkip = Symbol('skip');

module.exports = class BaseImport {
    constructor(filePath, database) {
        this[kFilePath] = filePath;
        this[kContents] = {};
        this[kDB] = database;

        // Values that can be set by the implementer
        this[kSkip] = false;
    }

    static getSource() {
        return [];
    }

    get filePath() {
        return this[kFilePath];
    }

    get fileName() {
        return path.parse(this[kFilePath]).base;
    }

    get fileDir() {
        return path.parse(this[kFilePath]).dir;
    }

    get couch() {
        return Couch.get(this[kDB]);
    }

    async getContents(encoding = null, cache = true) {
        if (cache) {
            if (!this[kContents][encoding]) {
                this[kContents][encoding] = await fs.readFile(this[kFilePath], encoding);
            }
            return this[kContents][encoding];
        } else {
            return fs.readFile(this[kFilePath], encoding);
        }
    }

    /**
     * Don't import the file and keep it where it is
     */
    skip() {
        this[kSkip] = true;
    }
};
