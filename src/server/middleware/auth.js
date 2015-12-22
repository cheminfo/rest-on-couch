'use strict';
const error = require('../error');
const FlavorUtils = require('flavor-utils');
const authPlugins = [['google', 'oauth2'],['couchdb'], ['facebook', 'oauth2'],['github','oauth2']];
const auths = [];
const url = require('url');

exports.init = function(passport, router, config) {
    for (var i = 0; i < authPlugins.length; i++) {
        try {
            // check that parameter exists
            var conf;
            if(conf = configExists(authPlugins[i])) {
                console.log('loading auth plugin', authPlugins[i]);
                var auth = require('../auth/' + authPlugins[i].join('/') + '/index.js');
                auth.init(passport, router, conf);
                auths.push(auth);
            }
            else {
                console.log('Auth plugin not configured', authPlugins[i]);
            }
        } catch(e) {
            console.log('Could not init auth middleware...', e.message);
            console.log(e.stack);
        }
    }


    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    function configExists(conf) {
        if(!config.auth) return null;
        var last = config.auth;
        for(var j=0; j<conf.length; j++) {
            if(!last[conf[j]]) return null;
            last = last[conf[j]];
            last.publicAddress = config.publicAddress;
            last.couchUrl = config.couchUrl;
        }
        return last;
    }


    router.get('/login', function*() {
        console.log('get login')

        yield this.render('login', { user: this.session.passport.user , config:config, authPlugins: authPlugins});
    });


    router.get('/account', this.ensureAuthenticated, function*(){
        yield this.render('account', { user: this.session.passport.user });
    });

    router.get('/_session', function*(next){
        var that = this;
        // Check if session exists
        var email = exports.getUserEmail(that);
        this.body = JSON.stringify({
            ok: true,
            userCtx: {
                name: email
            }
        });
        try{
            var parsedPath = url.parse(config.couchUrl);
            parsedPath.auth = config.couchUsername + ':' + config.couchPassword;
            var fullUrl = url.format(parsedPath);
            if(!config.firstLoginClone || !email){
                return yield next;
            }

            var hasViews = yield FlavorUtils.hasViews({
                couchUrl: fullUrl,
                couchDatabase: config.couchDatabase,
                username: email,
                flavor: config.firstLoginClone.targetFlavor
            });
            if(hasViews) {
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
        } catch(e) {
            yield next;
        }

        yield next;
    });

    router.delete('/_session', function*(){
        this.logout();
        this.body = JSON.stringify({
            ok: true
        });
    });
};

exports.ensureAuthenticated = function *(next) {
    if (this.isAuthenticated()) {
        yield next;
        return;
    }
    this.status = 401;
};

exports.getUserEmail = function(ctx) {
    if (!ctx.session.passport) return 'anonymous';
    var user = ctx.session.passport.user;
    if(!user) {
        throw new Error('UNREACHABLE');
    }
    var email;
    switch(user.provider) {
        case 'github':
            email = user.email || null;
            break;
        case 'google':
            if(user._json.verified_email === true)
                email = user._json.email;
            else
                email = null;
            break;
        case 'facebook':
            if(user._json.verified === true) {
                email = user._json.email;
            }
            else {
                email = null;
            }
            break;
        case 'local':
            email = user.email;
            break;
        case 'couchdb':
            email  = user.email || null;
            break;
        default:
            email = null;
            break;
    }
    return email || 'anonymous';
};

exports.emailMatches = function(ctx, email) {
    var sessionEmail = this.getUserEmail(ctx);
    return email.toLowerCase() === sessionEmail.toLowerCase();
};

exports.ensureEmailMatches = function*(next) {
    try{
        var name = this.state.couchdb.document.name;

    }
    catch(e) {
        return this.statusCode(500);
    }
    var sessionEmail = exports.getUserEmail(this);
    if(compareEmails(sessionEmail, name))
        yield next;
    else
        error.handleError('private');
};

exports.ensureIsPublic = function*(next) {
    try{
        var isPublic = this.state.couchdb.document.public;
    }
    catch(e) {
        return this.statusCode(500);
    }
    if(isPublic === true) {
        yield next;
    }
    else {
        error.handleError(this, 'private');
    }
};

exports.ensureIsPublicOrEmailMatches = function*(next) {
    var isPublic = this.state.couchdb.document.public;
    var name = this.state.couchdb.document.name;
    var sessionEmail = exports.getUserEmail(this);
    if(isPublic || compareEmails(sessionEmail, name))
        yield next;
    else {
        error.handleError(this, 'private');
    }
};

exports.ensureDocIsSafe = function*(next) {
    if(this.request.body._attachments) {
        try {
            // Go through all the attachments and parse them as json
            for (var key in this.request.body._attachments) {
                var data = this.request.body._attachments[key].data;
                if(data === undefined) continue;
                JSON.parse((new Buffer(data, 'base64')).toString());
            }
        } catch(e) {
            this.status = 400;
            return;
        }
    }
    yield next;
};

exports.ensureAttachmentIsJson = function*(next) {
    if(typeof this.request.body === 'object' && this.request.body !== null) {
        return yield next;
    }
    try {
        var parsed = JSON.parse(this.request.body);
        if(typeof parsed !== 'object') {
            this.status = 400; return;
        }
    } catch(e) {
        this.status = 400;
        return;
    }
    yield next;
};

function compareEmails(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}
