'use strict';

const constants = require('../constants');
const filters = require('./filters');
const updates = require('./updates');
const validate_doc_update = require('./validateDocUpdate');
const views = require('./views');

module.exports = function getDesignDoc(custom) {
    custom = custom || {};
    
    if (custom.views) {
        for (const viewName in custom.views) {
            const view = custom.views[viewName];
            if (view.withOwner) {
                view.reduce = '_count'; // force the reduce for future optimizations.
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
        validate_doc_update,
        lists: Object.assign({}, custom.lists)
    };
};
