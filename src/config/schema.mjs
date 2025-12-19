import { z } from 'zod';

const level = z.union([
  z.literal('FATAL'),
  z.literal('ERROR'),
  z.literal('WARN'),
  z.literal('INFO'),
  z.literal('DEBUG'),
  z.literal('TRACE'),
]);

export const globalRightType = z.union([
  z.literal('delete'),
  z.literal('read'),
  z.literal('write'),
  z.literal('create'),
  z.literal('readGroup'),
  z.literal('writeGroup'),
  z.literal('createGroup'),
  z.literal('readImport'),
  z.literal('owner'),
  z.literal('addAttachment'),
]);

const authPlugin = z.looseObject({
  title: z.string().trim().optional(),
  showLogin: z.boolean().default(false),
});

const configBoolean = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === 'true' || value === 'false', {
      error: 'Value must be "true" or "false"',
    })
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      throw new Error('Unreachable');
    }),
]);

const globalRightUser = z.union([
  z.email(),
  z.literal('anyuser'),
  z.literal('anonymous'),
]);

const entryUnicity = z.union([z.literal('byOwner'), z.literal('global')]);

export const configSchema = z.looseObject({
  // Main options
  url: z.url().trim().default('http://127.0.0.1:5984'),
  username: z.string().trim().default('rest-on-couch'),
  password: z.string(),
  adminPassword: z.string(),
  logLevel: level.default('FATAL'),
  authRenewal: z.number().default(570),
  ldapGroupsRenewal: z.number().default(300),
  administrators: z.array(z.email()).default([]),
  superAdministrators: z.array(z.email()).default([]),

  // Server options
  port: z.number().default(3000),
  fileDropPort: z.number().default(3001),
  auth: z.object({
    couchdb: authPlugin.default({}),
    github: authPlugin.optional(),
    google: authPlugin.optional(),
    ldap: authPlugin.optional(),
    oidc: authPlugin.optional(),
  }),
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
  proxy: configBoolean.default(true),
  proxyPrefix: z
    .string()
    .trim()
    .default('')
    .transform((value) => {
      let transformed = value;
      // Add loading slash
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
  sessionMaxAge: z.number().default(24 * 60 * 60 * 1000), // One day
  sessionPath: z.string().trim().default('/'),
  sessionSecure: configBoolean.default(false),
  sessionSigned: configBoolean.default(true),
  sessionSameSite: z.string().trim().default('lax'),

  allowedOrigins: z.array(z.string()).default([]),
  debugrest: configBoolean.default(false),
  /**
   * Global rights
   */
  rights: z
    .partialRecord(globalRightType, z.array(globalRightUser))
    .default({}),
  getUserInfo: z.function().default(() => (email) => {
    return { email };
  }),
  ldapGetUserEmail: z.function().default(() => (user) => {
    return user.mail;
  }),
  getPublicUserInfo: z.function().default(() => () => null),
  entryUnicity: entryUnicity.default('byOwner'), // can be byOwner or global

  // Options related to audit logs
  auditActions: configBoolean.default(false),
  auditActionsDb: z.string().trim().default('roc-audit-actions'),

  beforeCreateHook: z.function().optional(),
});
