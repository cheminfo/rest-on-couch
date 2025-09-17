# rest-on-couch

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

Interface to CouchDB that allows the control of permissions on the documents.

## REST API

[API documentation](API.md)

## Configuration

The configuration is being read on-load from many sources, in the following order (ascending priority):

1. Default configuration. Some configuration elements have default values. They are defined in the [source code](./src/config/default.js)
2. Main configuration file (`config.js` or `config.json` in ROC's home directory). See [this configuration example](./test/homeDirectories/dev/config.js) which is used for the dev server.
3. Database configuration file (`config.js` in database's subdirectory)
4. Environment variable (uppercase snake-case with `REST_ON_COUCH_` prefix)
5. Custom config file passed with `--config` in the CLI

### Main options

#### url

Type: string  
Default: `'http://localhost:5984'`  
URL of the CouchDB server.

#### username

Type: string  
Default: `undefined`  
Username for CouchDB connection.

#### password

Type: string  
Default: `undefined`  
Password for CouchDB connection.

#### logLevel

Type: string  
Default: `'WARN'`  
Level of the logs stored in the database. Possible values are FATAL (1), ERROR (2), WARN (3), INFO (4), DEBUG (5) and TRACE (6).
Logs are only inserted if the current level is equal or higher to the log's level.

#### authRenewal

Type: number  
Default: `570`  
Time in seconds that the application waits before revalidating the session with CouchDB.
This number should be smaller than the session's cookie life.

### Server options

#### port

Type: number  
Default: `3000`  
Port used by the rest-on-couch server.

#### auth

Type: object  
Default: `{couchdb:{}}`  
Object describing the authentication strategies that are available and providing options to them.

#### proxy

Type: boolean  
Default: `true`  
Set to `true` if your application is behind a proxy and needs to trust `X-Forwarded-` headers.

#### proxyPrefix

Type: string  
Default: `'/'`  
If the proxy is not at the root level of the URL, set this value to the corresponding prefix.

#### allowedOrigins

Type: array\<string>  
Default: `[]`  
If cross-origin calls need to be done, set the list of trusted origins here.

#### sessionDomain

Type: string  
Default: `undefined`  
Domain of the session cookie.

#### sessionKey

Type: string
Default: `'roc:sess'`
Key of the session cookie.

#### sessionPath

Type: string
Default: `'/'`
Path of the session cookie.

#### sessionSecure

Type: boolean  
Default: `false`  
Set to `true` if the cookie should only be valid on secure URLs.

#### sessionSameSite

Type: string
Default: `'lax'`
Value of the ["SameSite"](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) cookie option. Set to `'strict'`, `'lax'`, or `'none'`.

#### debugrest

Type: boolean  
Default: `false`  
If set to `true`, a stack trace will be print to the body of the response when an error occurs.  
Do not use this in production!

## Setup environment with Docker (for running tests)

```bash
docker-compose up -d
node scripts/setup_database.mjs
npm test
```

## Automatic importation

`rest-on-couch` is able to watch folders and to automatically import data in the database.

A specific userguide is available [here](import.md).

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/rest-on-couch.svg
[npm-url]: https://www.npmjs.com/package/rest-on-couch
[ci-image]: https://github.com/mljs/matrix/workflows/Node.js%20CI/badge.svg?branch=main
[ci-url]: https://github.com/mljs/matrix/actions?query=workflow%3A%22Node.js+CI%22
[codecov-image]: https://codecov.io/gh/cheminfo/rest-on-couch/branch/main/graph/badge.svg?token=Uw2cOqZUg0
[codecov-url]: https://codecov.io/gh/cheminfo/rest-on-couch
[download-image]: https://img.shields.io/npm/dm/rest-on-couch.svg
[download-url]: https://www.npmjs.com/package/rest-on-couch
