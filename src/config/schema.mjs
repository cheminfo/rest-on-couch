import { z } from 'zod';

const level = z.enum(['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']);

export const globalRightType = z.enum([
  'admin',
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

const authPlugin = z.looseObject({
  title: z.string().trim().optional(),
  showLogin: z.boolean().default(false),
});

const boolean = z.union(
  [
    z.boolean(),
    z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => value === 'true' || value === 'false')
      .transform((v) => {
        return v === 'true';
      }),
  ],
  { error: 'Value must be a boolean, "true" or "false"' },
);

const nonnegativeInteger = z.union(
  [
    z.number().nonnegative(),
    z.string().trim().regex(/^\d+$/).transform(parseInt),
  ],
  { error: 'Value must be a non-negative integer' },
);

const globalRightUser = z.union([
  z.email(),
  z.literal('anyuser'),
  z.literal('anonymous'),
]);

const entryUnicity = z.enum(['byOwner', 'global']);

const functionSchema = z.custom((val) => {
  return typeof val === 'function';
}, 'Expecting a function');

export const configSchema = z.looseObject({
  // Main options
  url: z.url().trim().default('http://127.0.0.1:5984'),
  username: z.string().trim().default('rest-on-couch'),
  password: z.string(),
  adminPassword: z.string(),
  logLevel: level.default('FATAL'),
  authRenewal: nonnegativeInteger.default(570),
  ldapGroupsRenewal: nonnegativeInteger.default(300),
  administrators: z.array(z.email()).default([]),
  superAdministrators: z.array(z.email()).default([]),

  // Design documents
  customDesign: z
    .looseObject({
      views: z.record(z.string(), z.looseObject({})).default({}),
      indexes: z.record(z.string(), z.looseObject({})).default({}),
      filters: z.record(z.string(), functionSchema).default({}),
    })
    .default({
      views: {},
      indexes: {},
      filters: {},
    }),

  defaultEntry: z
    .union([z.record(z.string(), functionSchema), functionSchema])
    .default(() => getDefaultEntry),

  // Server options
  port: nonnegativeInteger.default(3000),
  fileDropPort: nonnegativeInteger.default(3001),
  auth: z
    .object({
      couchdb: authPlugin,
      github: authPlugin.optional(),
      google: authPlugin.optional(),
      ldap: authPlugin.optional(),
      oidc: authPlugin.optional(),
    })
    .default({ couchdb: {} }),
  /**
   * Default redirect after successful or failed authentication
   * The /auth/login endpoint has redirects when the user is already authenticated.
   * The default redirect is /
   * To redirect to a specific page, bring the user to the provider's login page with the `continue` query parameter set to the desired URL.
   */
  authRedirectUrl: z.string().trim().default('/auth/login'),
  authServers: z.array(z.string().trim()).default([]),
  /**
   * Make koa trust X-Forwarded- headers
   */
  proxy: boolean.default(true),
  proxyPrefix: z
    .string()
    .trim()
    .default('')
    .transform((value) => {
      let transformed = value;
      // Add leading slash
      if (!value.startsWith('/')) {
        transformed = `/${value}`;
      }
      // Remove trailing slash
      return transformed.replace(/\/+$/, '');
    }),
  publicAddress: z
    .string()
    .trim()
    .default('http://127.0.0.1:3000')
    .transform((value) => {
      // Remove trailing slash
      return value.replace(/\/+$/, '');
    }),
  keys: z.array(z.string().trim()).min(1),

  sessionKey: z.string().trim().default('roc:sess'),
  sessionMaxAge: nonnegativeInteger.default(24 * 60 * 60 * 1000), // One day
  sessionPath: z.string().trim().default('/'),
  sessionSecure: boolean.default(false),
  sessionSigned: boolean.default(true),
  sessionSameSite: z.string().trim().default('lax'),

  allowedOrigins: z.array(z.string()).default([]),
  debugrest: boolean.default(false),
  /**
   * Global rights
   */
  rights: z
    .partialRecord(globalRightType, z.array(globalRightUser))
    .default({}),
  getUserInfo: functionSchema.default(() => (email) => {
    return { email };
  }),
  ldapGetUserEmail: functionSchema.default(() => (user) => {
    return user.mail;
  }),
  getPublicUserInfo: functionSchema.default(() => () => null),
  entryUnicity: entryUnicity.default('byOwner'), // can be byOwner or global

  // Options related to audit logs
  auditActions: boolean.default(false),
  auditActionsDb: z.string().trim().default('roc-audit-actions'),

  beforeCreateHook: functionSchema.optional(),
});

function getDefaultEntry() {
  return {};
}
