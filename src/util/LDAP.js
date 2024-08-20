'use strict';

const ldapjs = require('ldapjs');

const debug = require('./debug')('ldap:client');

const defaultSearchOptions = {
  scope: 'sub',
  timeLimit: 1,
};

const defaultLdapOptions = {
  connectTimeout: 2000,
  timeout: 2000,
};

function search(ldapOptions, searchOptions) {
  searchOptions = { ...defaultSearchOptions, ...searchOptions };
  ldapOptions = { ...defaultLdapOptions, ...ldapOptions };

  return new Promise((resolve, reject) => {
    // ldap options should include bind options
    // if client could know when it is ready
    // promises would be much easier to handle :-(
    const client = ldapjs.createClient(ldapOptions);
    client.on('error', (e) => {
      reject(e);
    });

    client.__resolve__ = function onResolve(value) {
      client.destroy();
      resolve(value);
    };

    client.__reject__ = function onReject(err) {
      client.destroy();
      reject(err);
    };
    bind(client, ldapOptions.bindDN, ldapOptions.bindPassword)
      .then(() => {
        try {
          client.search(searchOptions.DN, searchOptions, (err, res) => {
            if (err) {
              client.__reject__(err);
              return;
            }
            const entries = [];
            res.on('searchEntry', (entry) => {
              entries.push(entry);
            });
            res.on('error', (err) => {
              client.__reject__(err);
            });
            res.on('end', () => {
              client.__resolve__(entries);
            });
          });
        } catch (e) {
          // LIBRARY!!! WHY DON'T YOU PASS ALL YOUR ERRORS IN THE CALLBACK!!!
          client.__reject__(e);
        }
      })
      .catch(() => {
        /* Error should be handled by __reject__ */
      });
  });
}

function bind(client, DN, password) {
  if (!DN || !password) {
    debug('ldap search: bypass authentication');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    try {
      client.bind(DN, password, (err) => {
        if (err) {
          client.__reject__(err);
          reject(err);
          return;
        }
        resolve();
      });
    } catch (e) {
      client.__reject__(e);
      reject(e);
    }
  });
}

module.exports = {
  search,
};
