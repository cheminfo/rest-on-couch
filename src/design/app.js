'use strict';

const constants = require('../constants');
const updates = require('./updates');
const views = require('./views');
const validate_doc_update = require('./validateDocUpdate');

module.exports = function getDesignDoc(custom) {
    custom = custom || {};
    return {
        _id: constants.DESIGN_DOC_ID,
        language: 'javascript',
        version: constants.DESIGN_DOC_VERSION,
        customVersion: custom.version,
        updates: Object.assign({}, custom.updates, updates),
        views: Object.assign({}, custom.views, views),
        validate_doc_update
    };
};
