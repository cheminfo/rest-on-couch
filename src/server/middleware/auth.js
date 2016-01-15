'use strict';

const FlavorUtils = require('flavor-utils');
const router = require('koa-router')({
    prefix: '/auth'
});
const superagent = require('superagent-promise')(require('superagent'), Promise);
const url = require('url');

const debug = require('../../util/debug')('auth');
const die = require('../../util/die');

const authPlugins = [['google', 'oauth2'],['couchdb'], ['facebook', 'oauth2'],['github','oauth2'], ['ldap']];
const auths = [];
var config;

exports.init = function(passport, _config) {
    config = _config;
    for (var i = 0; i < authPlugins.length; i++) {
        try {
            // check that parameter exists
            var conf = configExists(authPlugins[i]);
            if (conf) {
                debug('loading auth plugin: ' + authPlugins[i]);
                var auth = require('../auth/' + authPlugins[i].join('/') + '/index.js');
                auth.init(passport, router, conf);
                auths.push(auth);
            } else {
                debug('auth plugin not configured: ' + authPlugins[i]);
            }
        } catch (e) {
            debug.error(e);
            die('Could not init auth middleware: ' + e.message);
        }
    }


    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    function configExists(conf) {
        if (!config.auth) return null;
        var last = config.auth;
        for (var j=0; j<conf.length; j++) {
            if (!last[conf[j]]) return null;
            last = last[conf[j]];
            last.publicAddress = config.publicAddress;
            last.couchUrl = config.couchUrl;
        }
        return last;
    }

    router.get('/login', function*() {
        this.session.continue = this.session.continue || this.query.continue || '/';
        if (this.isAuthenticated()) {
            this.redirect(this.session.continue);
            this.session.continue = null;
        } else {
            yield this.render('login');
        }
    });

    router.get('/session', function * (next){
        var that = this;
        // Check if session exists
        var email = yield exports.getUserEmail(that);
        this.body = JSON.stringify({
            ok: true,
            userCtx: {
                name: email
            }
        });
        try {
            var parsedPath = url.parse(config.couchUrl);
            parsedPath.auth = config.couchUsername + ':' + config.couchPassword;
            var fullUrl = url.format(parsedPath);
            if (!config.firstLoginClone || !email){
                return yield next;
            }

            var hasViews = yield FlavorUtils.hasViews({
                couchUrl: fullUrl,
                couchDatabase: config.couchDatabase,
                username: email,
                flavor: config.firstLoginClone.targetFlavor
            });
            if (hasViews) {
                return yield next;
            }

            yield FlavorUtils.cloneFlavor({
                source: {
                    couchUrl: fullUrl,
                    couchDatabase: config.couchDatabase,
                    username: config.firstLoginClone.sourceUser,
                    flavor: config.firstLoginClone.sourceFlavor
                },
                target: {
                    couchUrl: fullUrl,
                    couchDatabase: config.couchDatabase,
                    username: email,
                    flavor: config.firstLoginClone.targetFlavor,
                    subFolder: config.firstLoginClone.targetSubFolder
                }
            });
        } catch (e) {
            yield next;
        }

        yield next;
    });

    router.get('/logout', function*(){
        this.logout();
        this.redirect('/auth/login');
    });

    return router;
};

exports.ensureAuthenticated = function *(next) {
    if (this.isAuthenticated()) {
        yield next;
        return;
    }
    this.status = 401;
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

    for (let i=0; i<config.authServers.length; i++) {
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


exports.getUserEmail = function(ctx) {
    let email, user;
    if (!ctx.session.passport) {
        email = 'anonymous';
    } else if (user = ctx.session.passport.user) {
        email = user.email;
    } else {
        debug('passport without user: ', ctx.session.passport);
        email = 'anonymous';
        //throw new Error('UNREACHABLE');
    }

    if (!email || email === 'anonymous') {
        return getUserEmailFromToken(ctx);
    }

    return Promise.resolve(email || 'anonymous');
};
