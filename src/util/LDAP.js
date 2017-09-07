'use strict';

const ldapjs = require('ldapjs');
const debug = require('./debug')('ldap:client');

function search(ldapOptions, searchOptions) {
    return new Promise((resolve, reject) => {
        // ldap options should include bind options
        // if client could know when it is ready
        // promises would be much easier to handle :-(
        const client = ldapjs.createClient(ldapOptions);
        client.on('error',  function(e) {
            reject(e);
        });
        client.__resolve__ = function(value) {
            client.destroy();
            resolve(value);
        };

        client.__reject__ = function(err) {
            client.destroy();
            reject(err);
        };
        return bind(client, ldapOptions.bindDN, ldapOptions.bindPassword).then(() => {
            client.search(searchOptions.base, searchOptions, (err, res) => {
                if (err) {
                    client.__reject__(err);
                    return;
                }
                const entries = [];
                res.on('searchEntry', function (entry) {
                    entries.push(entry);
                });
                res.on('error', function (err) {
                    client.__reject__(err);
                });
                res.on('end', function () {
                    client.__resolve__(entries);
                });
            });
        }).catch(e => {/* Error should be handled by __reject__ */});
    });
}

function bind(client, DN, password) {
    if(!DN || !password) {
        debug(`ldap search: bypass authentication`);
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        client.bindDN(DN, password, function(err) {
            if(err) {
                client.__reject__(err);
                reject(err);
                return;
            }
            resolve();
        });
    });
}

module.exports = search;
