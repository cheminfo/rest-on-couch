# rest-on-couch

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Interface to CouchDB that allows the control of permissions on the documents.

## Installation

`npm install rest-on-couch`

## Documentation

You can specify the CouchDB information in the config file or using environment variables:

* config.couchURL (COUCH_URL): URL of the database server
* config.couchDB (COUCH_DB): Name of the database
* config.couchUser (COUCH_USER): Username (needs admin access to the DB)
* config.couchPassword (COUCH_PASSWORD): Password

### Configuration file
 
### Node.js API

TODO

### CLI

#### Import a file

```
./src/import --config=path/to/config path/to/file
```

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
