'use strict';

const got = require('got');
const passport = require('koa-passport');

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');
const isEmail = require('../../util/isEmail');
const getNano = require('../../util/nanoShim');

const { decorateError } = require('./decorateError');
const respondOk = require('./respondOk');

passport.serializeUser(function serializeUser(user, done) {
  done(null, user);
});

passport.deserializeUser(function deserializeUser(obj, done) {
  done(null, obj);
});

exports.okOrRedirect = function okOrRedirect(ctx) {
  switch (ctx.accepts('json', 'html')) {
    case 'json':
      // We do not use respondOk because status must stay as it was set by passport
      ctx.body = { ok: true };
      break;
    default:
      ctx.redirect('/auth/login');
  }
};

exports.afterSuccess = (ctx) => {
  exports.okOrRedirect(ctx);
};

exports.afterFailure = async (ctx, next) => {
  await next();
  if (ctx.status === 401) {
    // authentication failed with passport
    exports.okOrRedirect(ctx);
  }
};

exports.ensureAdmin = async (ctx, next) => {
  if (exports.isAdmin(ctx)) {
    await next();
  } else {
    decorateError(ctx, 403, 'restricted to administrators');
  }
};

exports.isAdmin = function isAdmin(ctx) {
  // Don't allow tokens to check for admins
  if (ctx.isAuthenticated()) {
    const email = ctx.session.passport.user.email;
    if (config.administrators.includes(email)) {
      return true;
    }
  }
  return false;
};

exports.ensureAuthenticated = async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    await next();
    return;
  }
  ctx.status = 401;
};

exports.getUserEmail = function getUserEmail(ctx) {
  let email, user;
  if (!ctx.session.passport) {
    email = 'anonymous';
  } else if ((user = ctx.session.passport.user)) {
    email = user.email;
  } else {
    debug('passport without user');
    email = 'anonymous';
  }

  if (!email || email === 'anonymous') {
    return getUserEmailFromToken(ctx);
  }

  return email || 'anonymous';
};

exports.getProvider = function getProvider(ctx) {
  let user;
  if (ctx.session.passport && (user = ctx.session.passport.user)) {
    return user.provider;
  } else {
    return null;
  }
};

async function getUserEmailFromToken(ctx) {
  if (!config.authServers.length) return 'anonymous';

  const token = ctx.headers['x-auth-session'] || ctx.query['x-auth-session'];
  if (!token) return 'anonymous';

  for (let i = 0; i < config.authServers.length; i++) {
    const res = await got(
      `${config.authServers[i].replace(/\/$/, '')}/_session`,
      {
        responseType: 'json',
        headers: {
          cookie: token,
        },
        throwHttpErrors: false,
      },
    );

    if (res.body && res.body.userCtx) {
      return res.body.userCtx.name;
    }
  }

  return 'anonymous';
}

exports.createUser = async (ctx) => {
  const { email, password } = ctx.request.body;
  if (!isEmail(email)) {
    decorateError(ctx, 400, 'username must be an email address');
    return;
  }

  let currentUser;
  try {
    currentUser = await getCouchdbUser(email);
  } catch {
    userDatabaseDenied(ctx);
    return;
  }

  if (currentUser !== null) {
    debug('Cannot create couchdb user, user already exists');
    decorateError(ctx, 400, 'user already exists');
    return;
  }

  await updateCouchdbUser({
    _id: `org.couchdb.user:${email}`,
    name: email,
    password,
    type: 'user',
    roles: [],
  });

  respondOk(ctx, 201);
};

exports.changePassword = async (ctx) => {
  const body = ctx.request.body;
  if (!body.oldPassword || !body.newPassword) {
    decorateError(
      ctx,
      400,
      'oldPassword and newPassword fields must be present',
    );
    return;
  }
  if (body.oldPassword === body.newPassword) {
    decorateError(ctx, 400, 'newPassword must be different than oldPassword');
    return;
  }
  if (!ctx.isAuthenticated()) {
    decorateError(ctx, 401, 'user must be authenticated');
    return;
  }

  const { email, provider } = ctx.session.passport.user;
  if (provider === 'local') {
    // check oldPassword
    try {
      await got.post(`${config.url}/_session`, {
        json: {
          name: email,
          password: body.oldPassword,
        },
      });
    } catch (e) {
      if (e.response.statusCode === 401) {
        decorateError(ctx, 401, 'wrong old password');
        return;
      } else {
        throw e;
      }
    }

    let currentUser;
    try {
      currentUser = await getCouchdbUser(email);
    } catch {
      userDatabaseDenied(ctx);
      return;
    }

    currentUser.password = String(body.newPassword);
    await updateCouchdbUser(currentUser);
    respondOk(ctx);
  } else {
    decorateError(
      ctx,
      403,
      `login provider "${provider} does not support password change`,
    );
  }
};

async function getCouchdbUser(email) {
  const nano = await getAdminNano();
  const db = nano.useDb('_users');
  return db.getDocument(`org.couchdb.user:${email}`);
}

function userDatabaseDenied(ctx) {
  debug.error('ROC user does not have access to _users database');
  decorateError(ctx, 500);
}

async function updateCouchdbUser(user) {
  // Creating / updating users is reserved for admins
  const nano = await getAdminNano();
  const db = nano.useDb('_users');
  return db.insertDocument(user);
}

function getAdminNano() {
  if (!config.adminPassword) {
    throw new Error('Admin password is not set');
  }
  return getNano(config.url, 'admin', config.adminPassword);
}
