'use strict';

module.exports = function(agent, username, password) {
    return agent.post('/auth/login/couchdb')
        .type('form')
        .send({username, password})
        .then(() => agent.get('/auth/session'))
        .then(res => {
            if (!res.body.authenticated) {
                throw new Error(`Could not authenticate on CouchDB as ${username}:${password}`);
            }
        });
};