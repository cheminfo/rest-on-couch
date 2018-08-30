# Automatic importation

Automatic importation of files is one of the main feature of rest-on-couch. The idea
is that by placing text files in specific folder the data will be imported periodically.

As an example we can take a database called `eln`. On the file system we will have this
kind of hierarchy:

| path                                  | description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| rest-on-couch-home                    | rest-on-couch home of configurations file                                            |
| rest-on-couch-home/config.js          | general configuration applying to all databases                                      |
| rest-on-couch-home/eln/               | home of configuration of a specific database, here `eln`                             |
| rest-on-couch-home/eln/config.js      | configuration of a specific database, here `eln`. Define here custom couchdb `views` |
| rest-on-couch-home/eln/nmr/import.js  | script allowing to import automatically files and add metadata and attachments       |
| rest-on-couch-home/eln/nmr/to_process | drop here the files to be processed                                                  |
| rest-on-couch-home/eln/nmr/processed  | find here the processed files                                                        |
| rest-on-couch-home/eln/nmr/errored    | find here the errored files                                                          |

## import.js

`import.js` must export an async function that will be used to process files to import.

```js
nmrImport.source = ['/mnt/nmr1', '/mnt/nmr2'];

async function nmrImport(importContext, result) {
  // importation procedure goes here
}

module.exports = nmrImport;
```

### Import options

Additional import options can be set by adding some properties to the import function:

- `source`: Can be set to an array of additional directories to look for files to import.
  Each directory must have the structure with `to_process`, `processed`, `errored` and the
  `rest-on-couch-import` process must be able to read and move files between these directories.
- `fileSizeChangeDelay`: If set to a positive number, the importation procedure
  will verify that the file size didn't change after the specified number of milliseconds
  has elapsed. This can be used if files to import are being directly copied to the `to_process`
  directory over the network. It can help to avoid importing incomplete files.

### Import context

The import function takes two arguments. The first is `importContext`, and allows to retrieve all information about the file being currently imported. It has the following properties and methods:

- `filename`: the name of the file to import
- `fileDir`: the path to the file to import
- `fileExt`: the extension of the file
- `couch`: an instance of Couch. This should only be used in extreme cases where the provided import API is not sufficient.

It also has the following methods:

- `async getContents(encoding = null, cache = true)`: allows to retrieve the
  contents of the file. If an encoding such as `'utf8'`or `'latin1'` is provided,
  a string is returned. Otherwise, the function returns a Node.js Buffer.

### Import result

The second argument is `importResult` and allows to manipulate the result that will be stored in the database. It has the following properties and methods: (**bold** means mandatory):

- **kind**: the kind of entry (eg `'sample'`)
- **id**: the unique ID of the record in couchDB, the $ID field (eg `['abc','def']`)
- **owner**: the owner of the entry. It must be an email address (eg `'a@a.com'`)
- **jpath**: in which array should the attachment be saved (eg `['spectra', 'nmr']`)
- **reference**: a unique ID for the entry in the specified jpath. If an entry has
  this reference the metadata and attachment will be joined with the existing data,
  otherwise a new entry will be created in the array
- **field**: name of the field in which the attachment will be saved (eg `'jcamp'`).
  It will create a property with `{filename: '...'}` as a value. This means one reference
  can point to several files which path is located in the field property.
- content_type: the mimetype of the attachment (eg `'chemical/x-jcamp-dx'`);
- metadata: an object with all the properties containing metadata for this attachment (eg {solvent:'CDCl3', frequency:400})
- content: corresponds to the full entry. If you put an object in the `content` property it will be merged with the existing
  data
- filename: override filename. By default the actual name of the file being imported is used when saving the attachment, and this property allows to override it.

Result object also has the following functions:

**Important note**: The filename of the attachment in the couchdb document will be generated from both the jpath and the filename. For example if the jpath is `['path','to','metadata']`, and the filename is `myFile.txt`, the couchdb attachment name will be `path/to/metadata/myFile.txt`. Therefore keep in mind that if you reimport a file, the old attachment might be replaced by the new one.

- addGroup(group): allows to add a group to the entry (eg `result.addGroup('group1')`);
- addGroups(groups): allows to add many groups at once to the entry (eg `result.addGroups(['group2', 'group3'])`)
- skipAttachment(): call this to prevent the importation of the imported file itself
- skipMetadata(): call this to prevent the importation of the metadata
- addAttachment(): add an attachment. This can be called multiple times to add more attachments
- skip(): skip this importation for now. The file will stay in the `to_process` directory

## Examples

### Unique filename

Script that generates unique filenames forcing all the files to be imported.

```js
module.exports = async function import(ctx, result) {
  result.skipAttachment(); // we don't use the default importation procedure
  var newFilename = ctx.filename.replace(/(._)\.(._)/, '$1.' + Date.now() + '.$2');
  var metaData = {
    solvent: 'CDCl3'
  };
  result.addAttachment({
    jpath: ['spectra', 'nmr'],
    metadata: metadata,
    reference: newFilename, // we ensure the unicity of the reference as well
    contents: ctx.getContents(),
    field: 'jcamp',
    filename: newFilename,
    content_type: 'chemical/x-jcamp-dx'
  });
}
```

### Only metadata

Script that allows to import JSON.

```js
module.exports = async function import(ctx, result) {
  result.skipAttachment(); // we don't use the default importation procedure
  result.skipMetadata();
  result.content = JSON.parse(ctx.getContents());
}
```

### Wait that file finished to write

In this script we will check if the end of the file contains a specific String otherwise
we skip the file for now.

```js
module.exports = async function import(ctx, result) {
  var text = ctx.getContents('UTF8');
  if (text.length > 100 && text.substring(text.length - 10).includes("##END")) {
    result.skip();
  }
}
```

### Importing 2 files in the same record

Some instrument may export 2 files in the same folder for the same experiment.

The system by default check if the reference exists. If it exists the metadata will be
merged (Object.assign).

In order to keep both file take care that the result.field is different !

- test.jdx
- test.fid

```js
const fs = require('fs');

module.exports = async function import(ctx, result) {
  let reference = ctx.filename.replace(/(.fid|.jdx)$/,'');
  result.contents = ctx.getContents('utf8');
  result.reference = ctx.filename;
  if (ctx.fileExt === 'fid') {
    result.field = 'jcampFID';
  } else if (ctx.fileExt === 'jdx') {
    result.field = 'jcamp';
  }
}
```
