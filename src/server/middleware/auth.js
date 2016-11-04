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

exports.getUserEmail = function (ctx) {
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

    return Promise.resolve(email || 'anonymous');
};

function getUserEmailFromToken(ctx) {
    if (!config.authServers.length) return Promise.resolve('anonymous');
    const token = ctx.headers['x-auth-session'] || ctx.query['x-auth-session'];
    if (!token) return Promise.resolve('anonymous');

    let res = {
        ok: true,
        userCtx: null
    };

    let prom = Promise.resolve(res);

    for (let i = 0; i < config.authServers.length; i++) {
        prom = prom.then(res => {
            if (res.userCtx !== null && res.userCtx !== 'anonymous') {
                return res;
            }
            return superagent
                .get(`${config.authServers[i].replace(/\/$/, '')}/_session`)
                .set('cookie', token)
                .end().then(res => {
                    return JSON.parse(res.text);
                });
        });
    }

    return prom.then(res => res.userCtx ? res.userCtx.name : 'anonymous');
}
