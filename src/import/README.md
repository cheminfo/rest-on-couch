## Automatic importation

Automatic importation of files is one of the main feature of rest-on-couch. The idea
is that by placing text files in specific folder the data can be imported automatically.

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

`import.js` will exports an async function that will be used to process files to import.
`module.exports = async function nmrImport(ctx, result) {}`

"Important note": filename HAS to be unique for a specific kind of data otherwise the existing file will be replaced !!
This is true even if the field `reference` is different.

The importation procedure has a special `ctx` in which the following variables are available:

- filename: the name of the file to import
- fileDir: the path to the file to import
- fileExt: the extension of the file
- couch: an instance of Couch

It also has the following functions:

- getContents(encoding = null, cache = true): allows to retrieve the content of the file. if the encoding is 'utf8' you get back a String that you can directly use, otherwise you get a Buffer.

The result object may have the following properties:

- kind: the kind of entry (eg 'sample')
- id: the unique ID of the record in couchDB, the $ID field -(eg ['abc','def'])
- owner: the owner of the entry if it does not exists, it must be an email (eg 'a@a.com')
- reference = a unique ID that will decide if the attachment is added or replaced
- field: name of the field in which the attachment will be saved (eg 'jcamp')
- jpath: in which array should the attachment be saved (eg ['spectra', 'nmr'])
- content_type: the mimetype of the attachment (eg 'chemical/x-jcamp-dx');
- metadata: an object with all the properties containing metadata (eg {solvent:'CDCl3', frequency:400})
- content: corresponds to the full entry. If you put an object in the `content` property it will be merged with the existing
  data

Result object also has the following functions:

- addGroup(group): allows to add a group to the entry (eg 'addGroup(group1)');
- addGroups(groups): allows to add many groups at once to the entry (eg addGroups(['group2', 'group3']))
- skipAttachment(): useful if you want to add manually attachments. This could be the case if you need to change the
  content of the file or if you want to attach more than one file at the same time.
- skipMetadata()
- addAttachment()

## FAQ

### Unique filename

How to I create a script that generates unique file names ?

```js
module.exports = async function import(ctx, result) {
    result.skipAttachment(); // we don't use the default importation procedure
    var newFilename=ctx.filename.replace(/(._)\.(._)/,'$1.'+Date.now()+'.$2');
    var metaData={
        solvent: 'CDCl3'
    };
    result.addAttachment({
        jpath: ['spectra', 'nmr'],
        metadata: metadata,
        reference: newFilename, // we ensure the unicity of the reference as well
        contents: Buffer.from(jcamp),
        field: isFt ? 'jcamp' : 'jcampFID',
        filename: newFilename,
        content_type: 'chemical/x-jcamp-dx'
    });
}
```
