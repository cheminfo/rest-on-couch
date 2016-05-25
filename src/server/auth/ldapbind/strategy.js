'use strict';

/*
 Strategy copied from: https://github.com/genialeo/passport-ldapbind

 The MIT License (MIT)

 Copyright (c) 2014 Leonardo Fenu

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const ldap = require('ldapjs');

function Strategy(options, verify) {
    if (!options || typeof options === 'function') {
        throw new Error('LDAP authentication strategy requires options');
    }

    this.name = 'ldapbind';
    this.options = options;
    this.verify = verify;
}

var verify = function() {
    return function(err, user, info) {
        if (err)   return this.error(err);
        if (!user) return this.fail(info);
        return this.success(user, info);
    }.bind(this);
};


Strategy.prototype.authenticate = function(req) {
    var self = this;

    if (!req.body.username || !req.body.password) {
        return self.fail(401);
    }

    var username = req.body.username;
    if (!username) {
        return retry('username required');
    }

    var password = req.body.password;
    if (!password) {
        return retry('password required');
    }

    var client = ldap.createClient(this.options.server);

    client.bind(username, password, function (err, user) {
        client.unbind();
        if (err) {
            if (err.name === 'InvalidCredentialsError' || err.name === 'NoSuchObjectError' || (typeof err === 'string' && err.match(/no such user/i))) {
                return self.fail('Invalid username/password');
            }
            return self.error(err);
        }
        else {
            if (self.verify) {
                if (self.options.passReqToCallback) {
                    return self.verify(req, username, verify.call(self));
                } else {
                    return self.verify(username, verify.call(self));
                }
            } else {
                return self.success(username);
            }
        }
    });
};

module.exports = Strategy;
