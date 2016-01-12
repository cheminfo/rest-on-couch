'use strict';

const path = require('path');
const homeConfig = require('./home').config;
const debug = require('../util/debug')('config:main');

module.exports = getMainConfig(homeConfig.homeDir);

function getMainConfig(homeDir) {
    if (!homeDir) {
        return {};
    }
    try {
        return require(path.join(homeDir, 'config'));
    } catch (e) {
        debug('no main config file');
        return {};
    }
}
