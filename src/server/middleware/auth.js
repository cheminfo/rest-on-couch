'use strict';

const passport = require('koa-passport');
const superagent = require('superagent-promise')(require('superagent'), Promise);

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('auth');

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

exports.afterSuccess = function* () {
    exports.okOrRedirect(this);
};

exports.afterFailure = function* (next) {
    yield next;
    if (this.status === 401) { // authentication failed with passport
        exports.okOrRedirect(this);
    }
};

exports.ensureAuthenticated = function* (next) {
    if (this.isAuthenticated()) {
        yield next;
        return;
    }
    this.status = 401;
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
