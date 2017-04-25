'use strict';

const passport = require('koa-passport');
const superagent = require('superagent-promise')(require('superagent'), Promise);
const request = require('request-promise');

const connect = require('../../connect');
const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');
const nanoPromise = require('../../util/nanoPromise');
const isEmail = require('../../util/isEmail');

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

exports.okOrRedirect = function (ctx) {
    switch (ctx.accepts('json', 'html')) {
        case 'json':
            ctx.body = {ok: true};
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
    if (ctx.status === 401) { // authentication failed with passport
        exports.okOrRedirect(ctx);
    }
};

exports.ensureAdmin = async (ctx, next) => {
    if (exports.isAdmin(ctx)) {
        await next();
    } else {
        ctx.status = 401;
        ctx.body = {
            error: 'You are not an administrator'
        };
    }
};

exports.isAdmin = function (ctx) {
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

exports.getUserEmail = async function (ctx) {
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

exports.getProvider = function (ctx) {
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
        const res = await superagent
            .get(`${config.authServers[i].replace(/\/$/, '')}/_session`)
            .set('cookie', token);
        const parsed = JSON.parse(res.text);
        if (parsed.userCtx) {
            return parsed.userCtx.name;
        }
    }

    return 'anonymous';
}

exports.createUser = async ctx => {
    const {email, password} = ctx.request.body;
    if (!isEmail(email)) {
        ctx.body = {error: 'username must be an email address'};
        ctx.status = 400;
        return;
    }

    let currentUser;
    try {
        currentUser = await getCouchdbUser(email);
    } catch (e) {
        userDatabaseDenied(ctx);
        return;
    }

    if (currentUser !== null) {
        debug.debug('Cannot create couchdb user, user already exists');
        ctx.body = {error: 'user already exists'};
        ctx.status = 400;
        return;
    }

    await updateCouchdbUser({
        _id: `org.couchdb.user:${email}`,
        name: email,
        password,
        type: 'user',
        roles: []
    });

    ctx.status = 201;
    ctx.body = {ok: true};
};

exports.changePassword = async (ctx) => {
    const body = ctx.request.body;
    if (!body.oldPassword || !body.newPassword) {
        ctx.body = {error: 'oldPassword and newPassword fields must be present'};
        ctx.status = 400;
        return;
    }
    if (body.oldPassword === body.newPassword) {
        ctx.body = {error: 'newPassword must be different than oldPassword'};
        ctx.status = 400;
        return;
    }
    if (!ctx.isAuthenticated()) {
        ctx.body = {error: 'user must be authenticated'};
        ctx.status = 401;
        return;
    }

    const {email, provider} = ctx.session.passport.user;
    if (provider === 'local') {
        // check oldPassword
        try {
            await request.post(`${config.url}/_session`, {
                form: {
                    name: email,
                    password: body.oldPassword
                }
            });
        } catch (e) {
            if (e.statusCode === 401) {
                ctx.body = {error: 'wrong old password'};
                ctx.status = 401;
                return;
            } else {
                throw e;
            }
        }

        let currentUser;
        try {
            currentUser = await getCouchdbUser(email);
        } catch (e) {
            userDatabaseDenied(ctx);
            return;
        }

        currentUser.password = String(body.newPassword);
        await updateCouchdbUser(currentUser);
        ctx.body = {ok: true};
    } else {
        ctx.body = {error: `login provider "${provider} does not support password change`};
        ctx.body = 403;
    }
};

async function getCouchdbUser(email) {
    const nano = await connect.open();
    const db = nano.db.use('_users');
    return nanoPromise.getDocument(db, `org.couchdb.user:${email}`);
}

function userDatabaseDenied(ctx) {
    debug.error('ROC user does not have access to _users database');
    ctx.body = {error: 'internal server error'};
    ctx.status = 500;
}

async function updateCouchdbUser(user) {
    const nano = await connect.open();
    const db = nano.db.use('_users');
    return nanoPromise.insertDocument(db, user);

}
