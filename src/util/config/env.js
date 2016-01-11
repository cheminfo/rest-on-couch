'use strict';

const prefix = 'REST_ON_COUCH_';

const envConfig = {};
for (const name in process.env) {
    if (name.startsWith(prefix)) {
        envConfig[name.substring(prefix.length).toLowerCase()] = process.env[name];
    }
}

module.exports = envConfig;
