'use strict';

module.exports = {
    DESIGN_DOC_NAME: 'app',
    DESIGN_DOC_ID: '_design/app',
    DESIGN_DOC_VERSION: 1,
    RIGHTS_DOC_ID: 'rights',
    REST_COUCH_URL: process.env.REST_COUCH_URL || 'http://localhost:5984',
    REST_COUCH_USER: process.env.REST_COUCH_USER,
    REST_COUCH_PASSWORD: process.env.REST_COUCH_PASSWORD,
    REST_COUCH_DATABASE: process.env.REST_COUCH_DATABASE
};
