'use strict';

/* eslint-disable no-undef */

module.exports = {
    username: 'admin',
    password: 'admin',
    publicAddress: 'http://a5b06458.ngrok.io',
    autoCreateDatabase: true,
    customDesign: {
        views: {
            entryIdByRight: {
                map: function (doc) {
                    emitWithOwner(['x', 'y', 'z'], doc.$id);
                },
                withOwner: true
            }
        }
    },
    auth: {
        couchdb: {},
        ldap: {},
        google: {
            clientID: '972364289541-o1nmqlnkgiip8ujjigra2cbpiu6l0mi8.apps.googleusercontent.com',
            clientSecret: 't04__CXMjujZ_rw-W66Q1Nt4'
        }
    }
};
