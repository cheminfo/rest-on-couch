'use strict';

const ldapjs = require('ldapjs');

class LDAP {
    constructor(options) {
        this.client = ldapjs.createClient(options);
    }

    bind(dn, password) {
        return new Promise((resolve, reject) => {
            this.client.bind(dn, password, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    search(base, options) {
        const baseOptions = {
            scope: 'sub'
        };
        const entries = [];
        return new Promise((resolve, reject) => {
            this.client.search(base, Object.assign(baseOptions, options), function (err, res) {
                if (err) {
                    reject(err);
                    return;
                }
                res.on('searchEntry', function (entry) {
                    entries.push(entry);
                });
                res.on('error', function (err) {
                    reject(err);
                });
                res.on('end', function () {
                    resolve(entries);
                });
            });
        });
    }

    destroy() {
        this.client.destroy();
    }
}

module.exports = LDAP;
