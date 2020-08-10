#!/usr/bin/env node
/* eslint-disable no-await-in-loop */

'use strict';

const connect = require('../src/connect');
const { FileStorage } = require('../src/file-storage/FileStorage');
const debug = require('../src/util/debug')('bin:migrate-files');
const getConfiguredDbs = require('../src/util/getConfiguredDbs');

Promise.resolve()
  .then(async () => {
    const allDbs = await getConfiguredDbs();

    for (const db of allDbs) {
      const storage = new FileStorage(db);
      const nano = await connect.open();
      const dbNano = nano.useDb(db);
      const {
        body: { rows: allDocs },
      } = await dbNano.client.get('_all_docs');
      for (const { id: documentId } of allDocs) {
        const document = await dbNano.getDocument(documentId);
        if (document._attachments) {
          const attachments = document._attachments;
          delete document._attachments;
          const newAttachments = {};

          break;
        }
      }
    }
  })
  .catch((err) => {
    console.log('ERROR', err);
    debug.error(err);
    process.exit(1);
  });
