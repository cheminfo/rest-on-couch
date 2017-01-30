'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('../constants');
const filters = require('./filters');
const updates = require('./updates');
const validateDocUpdate = require('./validateDocUpdate');
const views = require('./views');
const getConfig = require('../config/config').getConfig;

const mapTpl = function (doc) {
    if (doc.$type !== 'entry') return;
    var emitWithOwner = function (key, data) {
        for (var i = 0; i < doc.$owners.length; i++) {
            if (key == null) {
                emit([doc.$owners[i]], data);
            } else {
                emit([doc.$owners[i]].concat(key), data);
            }
        }
    };
    var customMap = CUSTOM_MAP;
    customMap(doc);
}.toString();

// Extends design doc with default views
// Adds the special lib view to the design doc
module.exports = function (custom, dbName) {
    custom = custom || {};
    const config = getConfig(dbName);
    processViews(custom, config);
    if (custom.designDoc === 'app') {
        return {
            _id: constants.DESIGN_DOC_ID,
            language: 'javascript',
            version: constants.DESIGN_DOC_VERSION,
            customVersion: custom.version,
            filters: Object.assign({}, custom.filters, filters),
            updates: Object.assign({}, custom.updates, updates),
            views: Object.assign({}, custom.views, views),
            validate_doc_update: validateDocUpdate,
            lists: Object.assign({}, custom.lists)
        };
    } else {
        return custom;
    }
};

function processViews(custom, config) {
    if (custom.views) {
        for (const viewName in custom.views) {
            const view = custom.views[viewName];
            if (viewName !== 'lib') {
                if (view.withOwner && typeof view.map === 'function') {
                    view.map = mapTpl.replace('CUSTOM_MAP', view.map.toString());
                    view.reduce = '_count'; // force the reduce for future optimizations.
                }
            }
        }
    }
    // Lib is added to all design documents
    if (config.customDesign && config.customDesign.views && config.customDesign.views.lib) {
        if (!custom.views) custom.views = {};
        custom.views.lib = {};
        const view = config.customDesign.views.lib;
        for (const libName in view) {
            let lib = view[libName];
            if (!Array.isArray(lib)) {
                lib = [lib];
            }
            let libCode = lib[0];
            if (typeof libCode === 'string') {
                if (libCode.endsWith('.js')) {
                    libCode = fs.readFileSync(path.resolve(config.homeDir, config.database, libCode), 'utf8');
                }
                if (lib.length === 1) {
                    custom.views.lib[libName] = libCode;
                } else {
                    for (let i = 1; i < lib.length; i++) {
                        if (custom._id === `_design/${lib[i]}`) {
                            custom.views.lib[libName] = libCode;
                        }
                    }
                }
            }
        }
    }
}
