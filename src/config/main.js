'use strict';

const path = require('path');

const debug = require('../util/debug')('config:main');

const homeConfig = require('./home').config;
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
