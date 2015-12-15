'use strict';

const constants = require('../constants');

const ddoc = module.exports = {
    _id: constants.DESIGN_DOC_ID,
    language: 'javascript',
    version: constants.DESIGN_DOC_VERSION,
    views: require('./views'),
    validate_doc_update: require('./validateDocUpdate')
};
