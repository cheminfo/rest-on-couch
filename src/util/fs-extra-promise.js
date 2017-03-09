'use strict';

const fsExtra = require('fs-extra');
const Bluebird = require('bluebird');

module.exports = Bluebird.promisifyAll(fsExtra);
