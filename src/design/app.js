'use strict';

const constants = require('../constants');
const filters = require('./filters');
const updates = require('./updates');
const validate_doc_update = require('./validateDocUpdate');
const views = require('./views');

module.exports = function getDesignDoc(custom) {
    custom = custom || {};
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
