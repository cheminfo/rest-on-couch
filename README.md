# rest-on-couch

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Interface to CouchDB that allows the control of permissions on the documents.

## Documentation

* config.database (REST_ON_COUCH_DATABASE): Name of the database
* config.username (REST_ON_COUCH_USERNAME): Username (needs admin access to the DB)
* config.password (REST_ON_COUCH_PASSWORD): Password
* config.logLevel (REST_ON_COUCH_LOG_LEVEL)

### Configuration file
 
### Node.js API

TODO

### CLI

#### Import a file

| Command | Description |
| ------ | ----------- |
| ```rest-on-couch import``` | Import files |
| ```rest-on-couch server``` | Launch server |
| ```rest-on-couch log``` | get/set log entries |

```rest-on-couch <command> --help``` for more details

### Configuration

The configuration is being read on load from many sources, in the following order (ascending priority):
1. Default configuration. Some configuration elements have default values. They are defined in the [source code](./src/config/default.js)
2. Main configuration file (`config.js` or `config.json` in ROC's home directory)
3. Database configuration file (`config.js` in database's subdirectory)
4. Environment variable (uppercase snake-case with `REST_ON_COUCH_` prefix)
5. Custom config file passed with `--config` in the CLI

#### Main options

##### url

Type: string  
Default: `'http://localhost:5984'`  
URL of the CouchDB server.

##### logLevel

Type: string  
Default: `'WARN'`  
Level of the logs stored in the database. Possible values are FATAL (1), ERROR (2), WARN (3), INFO (4), DEBUG (5) and TRACE (6).
Logs are only inserted if the current level is equal or higher to the log's level.

##### authRenewal

Type: number  
Default: `570`  
Time in seconds that the application waits before revalidating the session with CouchDB.
This number should be smaller than the session's cookie life.

##### autoCreateDatabase

Type: boolean  
Default: `false`  
If set to `true`, the application will try to automatically create the database on CouchDB if it is missing.

#### Server options

##### port

Type: number  
Default: `3000`  
Port used by the rest-on-couch server.

##### auth

Type: object  
Default: `{couchdb:{}}`  
Object describing the authentication strategies that are available and providing options to them.

##### proxy

Type: boolean  
Default: `true`  
Set to `true` if your application is behind a proxy and needs to trust `X-Forwarded-` headers.

##### proxyPrefix

Type: string  
Default: `'/'`  
If the proxy is not at the root level of the URL, set this value to the corresponding prefix.

##### allowedOrigins

Type: array<string>  
Default: `[]`  
If cross-origin calls need to be done, set the list of trusted origins here.

##### sessionDomain

Type: string  
Default: `undefined`  
Domain of the session cookie.

##### sessionSecure

Type: boolean  
Default: `false`  
Set to `true` if the cookie should only be valid on secure URLs.

##### sessionSecureProxy

Type: boolean  
Default: `false`  
Set to `true` if the cookie is secure and SSL is handled by a proxy.

##### debugrest

Type: boolean  
Default: `false`  
If set to `true`, a stack trace will be print to the body of the response when an error occurs.  
Do not use this in production!

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/rest-on-couch.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/rest-on-couch
[travis-image]: https://img.shields.io/travis/cheminfo/rest-on-couch/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/cheminfo/rest-on-couch
[david-image]: https://img.shields.io/david/cheminfo/rest-on-couch.svg?style=flat-square
[david-url]: https://david-dm.org/cheminfo/rest-on-couch
[download-image]: https://img.shields.io/npm/dm/rest-on-couch.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/rest-on-couch
