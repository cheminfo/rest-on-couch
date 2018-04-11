'use strict';

const config = require('../../config/config').globalConfig;
const { RocZenodo } = require('../../roc-zenodo');

const decorateError = require('./decorateError');
const respondOk = require('./respondOk');
const { composeWithError } = require('./util');

let rocZenodo = new RocZenodo({
  zenodoHost: config.zenodoSandbox ? 'sandbox.zenodo.org' : 'zenodo.org',
  zenodoToken: config.zenodoToken,
  name: config.zenodoName,
  visualizationUrl: config.zenodoVisualizationUrl
});

exports.createEntry = composeWithError(async (ctx) => {
  const { entryId } = ctx.query;
  if (!entryId) {
    decorateError(ctx, 400, 'missing entryId query parameter');
    return;
  }
  const { couch, userEmail } = ctx.state;
  const zenodoEntry = await couch.getEntryWithRights(
    entryId,
    userEmail,
    'write'
  );
  const { $content: { meta, samples, doi } } = zenodoEntry;
  if (!samples || samples.length === 0) {
    decorateError(ctx, 400, 'cannot publish on Zenodo without samples');
  }
  if (typeof doi === 'string' && doi.length > 1) {
    decorateError(ctx, 403, 'this entry has already been published');
  }
  let depositionMeta;
  try {
    depositionMeta = await rocZenodo.getZenodoDeposition(meta);
  } catch (e) {
    decorateError(ctx, 400, e.message);
    return;
  }

  // We first get samples in case there is an error
  const entries = await Promise.all(
    samples.map((sample) => {
      if (sample.rev) {
        return couch.getEntryWithRights(sample.id, userEmail, 'read', {
          rev: sample.rev
        });
      } else {
        return couch.getEntryWithRights(sample.id, userEmail, 'read');
      }
    })
  );

  const deposition = await rocZenodo.createEntry(depositionMeta);

  const files = [];
  const toc = [];

  try {
    /* eslint-disable no-await-in-loop */
    for (const entry of entries) {
      const { _id: id, $content: content } = entry;
      files.push(
        await rocZenodo.uploadFile(deposition, {
          filename: `${id}/index.json`,
          contentType: 'application/octet-stream',
          data: JSON.stringify(content, null, 2)
        })
      );
      if (content.general.molfile) {
        files.push(
          await rocZenodo.uploadFile(deposition, {
            filename: `${id}/molfile.mol`,
            contentType: 'chemical/x-mdl-molfile',
            data: content.general.molfile
          })
        );
      }
      for (const attachmentPath in entry._attachments) {
        const contentType = entry._attachments[attachmentPath].content_type;
        const attachmentStream = await couch.getAttachmentByName(
          id,
          attachmentPath,
          userEmail,
          true
        );
        files.push(
          await rocZenodo.uploadFile(deposition, {
            filename: `${id}/${attachmentPath}`,
            contentType,
            data: attachmentStream
          })
        );

        toc.push({ kind: entry.$kind, id });
      }
      break;
    }
    /* eslint-enable */

    files.unshift(
      await rocZenodo.uploadFile(deposition, {
        filename: 'toc.json',
        contentType: 'application/octet-stream',
        data: JSON.stringify(toc, null, 2)
      })
    );
    files.unshift(
      await rocZenodo.uploadFile(deposition, rocZenodo.getIndexMd(deposition))
    );

    const zenodoFiles = await rocZenodo.getFileList(deposition);
    const sortedFiles = files.map((file) => {
      const zenodoFile = zenodoFiles.find((f) => f.filename === file.key);
      return zenodoFile.id;
    });
    await rocZenodo.sortFiles(deposition, sortedFiles);
  } catch (e) {
    await rocZenodo.deleteEntry(deposition);
    throw e;
  }

  // todo enable publish after testing
  // await rocZenodo.publish(deposition);

  zenodoEntry.$content.doi = deposition.metadata.prereserve_doi.doi;
  zenodoEntry.$content.status.push({
    epoch: Date.now(),
    value: 'Published'
  });

  await couch.insertEntry(zenodoEntry, userEmail);

  respondOk(ctx, 201);
});
