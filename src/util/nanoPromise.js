'use strict';

const debug = require('debug')('couch:nano');

exports.authenticate = function (nano, user, password) {
    return new Promise(function (resolve, reject) {
        debug('auth');
        nano.auth(user, password, function (err, body, headers) {
            if (err) {
                debug('auth failed');
                return reject(err);
            }
            if (headers && headers['set-cookie']) {
                debug('auth success');
                return resolve(headers['set-cookie']);
            }
            debug('auth failed');
            reject(new Error('authentication failure'));
        })
    });
};
