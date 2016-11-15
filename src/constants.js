'use strict';

const globalRightTypes = [
    'read',
    'write',
    'create',
    'createGroup'
];

const allowedFirstLevelKeys = [
    '$deleted'
];

module.exports = {
    DESIGN_DOC_NAME: 'app',
    DESIGN_DOC_ID: '_design/app',
    DESIGN_DOC_VERSION: 15,
    RIGHTS_DOC_ID: 'rights',
    DEFAULT_GROUPS_DOC_ID: 'defaultGroups',
    globalRightTypes,
    allowedFirstLevelKeys
};
