# couch-import
Check a folder and import in couchDB


* _id : uuid : unique code
* id : sample code
* owner: ['ab@cd.com']
* parent : []
* name : []
 * value
 * language (default 'en')
 * kind ('trademark', 'iupac', 'commercial', ...)
* molecule : []
 * type: 'mol2d'
 * value: ''
* nmr : []
 * solvent
 * frequency
 * experiment
 * temperature
 * file : []
  * type : pdf, jcamp, ...
  * filename : filename




## Node script
### exists(id)
### getIDFromFilename(callback)
### getIDFromContent(callback)
### getOwnerFromFilename(callback)
### getOwnerFromContent(callback)
### document <- getDocument(id)
### document <- create(id, callback)
Check if id exists. If yes "resolve with uuid". If no, create with result of callback and resolve with uuid.
### append(jpath, entry)

## Project specifc
### entry <- parseNMR(filename)
Create the entry:
* solvent
* frequence
* experiment
* file : []
 * type: jcamp
 * filename: filename


## Workflow
* new files
* we need to retrieve the ID of the file
 * id may be based on filename (getIDFromFilename)
 * id may be inside the file (getIDFromContent)
* entry <- parseNMR(filepath)
* document <- create(id, callback)
* document.append(jpath, entry, files)
 * Deal with revision inconsistency




## CouchDB
