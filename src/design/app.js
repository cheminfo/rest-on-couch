'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('../constants');
const filters = require('./filters');
const updates = require('./updates');
const validateDocUpdate = require('./validateDocUpdate');
const views = require('./views');

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

module.exports = function getDesignDoc(custom) {
    custom = custom || {};

    if (custom.views) {
        for (const viewName in custom.views) {
            const view = custom.views[viewName];
            if (viewName === 'lib') {
                for (const libName in view) {
                    const lib = view[libName];
                    if (typeof lib === 'string' && lib.endsWith('.js')) {
                        view[libName] = fs.readFileSync(path.resolve(lib), 'utf8');
                    }
                }
            } else {
                if (view.withOwner && typeof view.map === 'function') {
                    view.map = mapTpl.replace('CUSTOM_MAP', view.map.toString());
                    view.reduce = '_count'; // force the reduce for future optimizations.
                }
            }
        }
    }

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
};
