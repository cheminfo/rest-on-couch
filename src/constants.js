'use strict';

// super administrators have all these rights
const globalRightTypes = [
    'read',
    'write',
    'create',

    'readGroup',
    'writeGroup',
    'createGroup'
];

// administrators only have these rights
const globalAdminRightTypes = [
    'admin',
    'create',
    'createGroup'
];

const allowedFirstLevelKeys = [
    '$deleted'
];

module.exports = {
    DESIGN_DOC_NAME: 'app',
    DESIGN_DOC_ID: '_design/app',
    DESIGN_DOC_VERSION: 20,
    RIGHTS_DOC_ID: 'rights',
    DEFAULT_GROUPS_DOC_ID: 'defaultGroups',
    globalRightTypes,
    globalAdminRightTypes,
    allowedFirstLevelKeys
};
