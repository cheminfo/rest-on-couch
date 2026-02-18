'use strict';

// super administrators have all these rights
const { z } = require('zod');
const { globalRightType } = require('./config/schema.mjs');

const globalTypesSchema = z.array(globalRightType);

// This list does not include the 'admin' right
const globalRightTypes = globalTypesSchema.parse([
  'delete',
  'read',
  'write',
  'create',
  'readGroup',
  'writeGroup',
  'createGroup',
  'readImport',
  'owner',
  'addAttachment',
]);

// administrators only have these rights
const globalAdminRightTypes = globalTypesSchema.parse([
  'admin',
  'create',
  'createGroup',
]);

const allowedFirstLevelKeys = ['$deleted'];

const IMPORT_UPDATE_FULL = 'IMPORT_UPDATE_FULL';
const IMPORT_UPDATE_WITHOUT_ATTACHMENT = 'IMPORT_UPDATE_WITHOUT_ATTACHMENT';
const IMPORT_UPDATE_$CONTENT_ONLY = 'IMPORT_UPDATE_$CONTENT_ONLY';

module.exports = {
  CUSTOM_DESIGN_DOC_NAME: 'customApp',
  DESIGN_DOC_NAME: 'app',
  DESIGN_DOC_ID: '_design/app',
  RIGHTS_DOC_ID: 'rights',
  DEFAULT_GROUPS_DOC_ID: 'defaultGroups',

  globalRightTypes,
  globalAdminRightTypes,
  allowedFirstLevelKeys,

  kEntryUnicity: Symbol('entryUnicity'),
  kImportType: Symbol('importType'),
  IMPORT_UPDATE_FULL,
  IMPORT_UPDATE_WITHOUT_ATTACHMENT,
  IMPORT_UPDATE_$CONTENT_ONLY,
};
