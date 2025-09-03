export default function insertDocument(db, entry) {
  processEntry(entry);
  return db.insertDocument(entry);
}

function processEntry(entry) {
  if (entry.$type === 'entry') {
    if (entry.$id === undefined) {
      entry.$id = null;
    }
    if (entry.$kind === undefined) {
      entry.$kind = null;
    }
    if (typeof entry.$id === 'string' && !entry._id) {
      entry._id = entry.$id;
    }
  }
  if (entry.$type === 'group') {
    if (typeof entry.name === 'string' && !entry._id) {
      entry._id = entry.name;
    }
  }
  if (entry.$type === 'entry' || entry.$type === 'group') {
    if (!entry.$creationDate) entry.$creationDate = 0;
    if (!entry.$modificationDate) entry.$modificationDate = 0;
    if (!entry.$lastModification) {
      entry.$lastModification = 'test@example.com';
    }
  }
}
