'use strict';

async function uploadFile(deposition, options, self) {
  // deposition is the object returned by createEntry
  const zFiles = self.zenodo.files;
  const result = await zFiles.upload(Object.assign({ deposition }, options));
  return result.data;
}

module.exports = uploadFile;
