'use strict';

const config = require('../config/config');
const Couch = require('../index');
const fs = require('fs-extra');
const path = require('path');
const debug = require('./debug')('util:load');
var loaded = false;

module.exports = function () {
    debug.trace('preload databases that have a confguration file');
    const homeDir = config.globalConfig.homeDir;
    if (!homeDir) return;
    if (loaded) return;
    fs.readdir(homeDir, function (err, files) {
        if (err) return;
        for (let i = 0; i < files.length; i++) {
            fs.stat(path.join(homeDir, files[i]), function (err, res) {
                if (err) return;
                if (res.isDirectory()) {
                    fs.stat(path.join(homeDir, files[i], 'config.js'), function (err) {
                        if (!err) {
                            debug.trace(`found database config file: ${files[i]}`);
                            Couch.get(files[i]);
                        }
                    });
                }
            });
        }
    });
};
