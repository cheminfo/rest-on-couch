You are able to test the importation file direct from the terminal

Install globally rest-on-couch

`npm install --global rest-on-couch`

Execute the following instruction:

`DEBUG=couch* REST_ON_COUCH_HOME_DIR=/usr/local/rest-on-couch rest-on-couch-import fileToImport.jdx eln nmr --dry-run`

* eln: name of the couchDB database
* nmr: name of the folder in which the `import.js` is defined
