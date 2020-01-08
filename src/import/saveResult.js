'use strict';

const ASCIIFolder = require('fold-to-ascii');

const constants = require('../constants');

module.exports = async function saveResult(importBase, result) {
  const couch = importBase.couch;
  if (result.isSkipped) return;

  // Create the new document if it does not exist
  let document = await couch.createEntry(result.id, result.owner, {
    kind: result.kind,
    owners: result.groups,
  });

  // In case the document already existed, we need update the  list of owners
  if (result.groups.length) {
    document = await couch.addOwnersToDoc(
      document.id,
      result.owner,
      result.groups,
      'entry',
    );
  }

  const mainFilename =
    result.filename === null ? importBase.filename : result.filename;

  switch (result.getUpdateType()) {
    case constants.IMPORT_UPDATE_FULL:
      await couch.addFileToJpath(
        result.id,
        result.owner,
        result.jpath,
        result.metadata,
        {
          field: result.field,
          name: `${result.jpath.join('/')}/${ASCIIFolder.foldReplacing(
            mainFilename,
            '_',
          )}`,
          data: await importBase.getContents(),
          reference: result.reference,
          content_type: result.content_type,
        },
        result.content,
      );
      break;
    case constants.IMPORT_UPDATE_WITHOUT_ATTACHMENT:
      await couch.addFileToJpath(
        result.id,
        result.owner,
        result.jpath,
        result.metadata,
        {
          reference: result.reference,
        },
        result.content,
        true,
      );
      break;
    case constants.IMPORT_UPDATE_$CONTENT_ONLY:
      await couch.insertEntry(
        {
          $id: result.id,
          $kind: result.kind,
          $content: result.content,
          _id: document.id,
          _rev: document.rev,
        },
        result.owner,
        { merge: true },
      );
      break;
    default:
      throw new Error('Unreachable');
  }

  // Upload additional attachments with metadata
  for (const attachment of result.attachments) {
    const contents = Buffer.from(
      attachment.contents.buffer,
      attachment.contents.byteOffset,
      attachment.contents.byteLength,
    );
    // eslint-disable-next-line no-await-in-loop
    await couch.addFileToJpath(
      result.id,
      result.owner,
      attachment.jpath,
      attachment.metadata,
      {
        field: attachment.field,
        reference: attachment.reference,
        name: `${attachment.jpath.join('/')}/${ASCIIFolder.foldReplacing(
          attachment.filename,
          '_',
        )}`,
        data: contents,
        content_type: attachment.content_type,
      },
    );
  }

  return document.id;
};
