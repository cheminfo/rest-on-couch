# rest-on-couch

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![David deps][david-image]][david-url]
[![npm download][download-image]][download-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

Interface to CouchDB that allows the control of permissions on the documents.

### REST API

[API documentation](API.md)

### Configuration

The configuration is being read on load from many sources, in the following order (ascending priority):

1.  Default configuration. Some configuration elements have default values. They are defined in the [source code](./src/config/default.js)
2.  Main configuration file (`config.js` or `config.json` in ROC's home directory)
3.  Database configuration file (`config.js` in database's subdirectory)
4.  Environment variable (uppercase snake-case with `REST_ON_COUCH_` prefix)
5.  Custom config file passed with `--config` in the CLI

#### Main options

##### url

Type: string  
Default: `'http://localhost:5984'`  
URL of the CouchDB server.

##### username

Type: string  
Default: `undefined`  
Username for CouchDB connection.

##### password

Type: string  
Default: `undefined`  
Password for CouchDB connection.

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

##### sessionKey

Type: string
Default: `'roc:sess'`
Key of the session cookie.

##### sessionPath

Type: string
Default: `'/'`
Path of the session cookie.

##### sessionSecure

Type: boolean  
Default: `false`  
Set to `true` if the cookie should only be valid on secure URLs.

##### debugrest

Type: boolean  
Default: `false`  
If set to `true`, a stack trace will be print to the body of the response when an error occurs.  
Do not use this in production!

#### Zenodo options

##### zenodo

Type: boolean  
Default: `false`
If set to `true`, enables the Zenodo API.

##### zenodoSandbox

Type: boolean  
Default: `false`  
If set to `true`, API calls to Zenodo will use the sandbox endpoint.

##### zenodoToken

Type: string  
API token for Zenodo.  
This option is mandatory if `zenodo` is `true`.

##### zenodoName

Type: string  
Name of this application/database. This will be used in the keywords for each
entry that is created. For example, if `zenodoName` is `'db123'`, entries will
contain the keyword `'from:db123'`.  
This option is mandatory if `zenodo` is `true`.

##### zenodoVisualizationUrl

Type: string  
URL prefix for entry visualization. If set, the Zenodo entry ID will be appended
to this, optionally with a `?sandbox=1` query string. A link will be added at the
end of the entry's description.

##### zenodoReadme

Type: string  
Contents of the `_README.md` that is published in the Zenodo entry.  
This option is mandatory if `zenodo` is `true`.

##### zenodoAttachments

Type: function  
Function that is called with each ROC entry's contents and must return a list of
attachments to add to the Zenodo entry. It can also return an object if a single
attachment is to be added

```js
function zenodoAttachments(content) {
  if (content.general && content.general.molfile) {
    return {
      filename: 'molfile.mol',
      contentType: 'chemical/x-mdl-molfile',
      data: content.general.molfile
    };
  }
}
```

## Setup environment with Docker (for runnings tests)

```bash
docker pull couchdb
docker create -p 5984:5984 --name couchdb couchdb
docker start couchdb
docker ps # check that the container is running
```

Go to http://localhost:127.0.0.1/_utils/#setup

* Single node
* username: admin, password: admin
* bind address: 0.0.0.0
* Execute the bash script `/setupDatabase.sh`
* Execute the tests: `npm t`

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
[snyk-image]: https://snyk.io/test/github/cheminfo/rest-on-couch/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/github/cheminfo/rest-on-couch
