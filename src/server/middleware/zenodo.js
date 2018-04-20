'use strict';

const config = require('../../config/config').globalConfig;
const debug = require('../../util/debug')('zenodo');
const { RocZenodo } = require('../../roc-zenodo');

const decorateError = require('./decorateError');
const { composeWithError } = require('./util');

let rocZenodo = new RocZenodo({
  sandbox: config.zenodoSandbox,
  token: config.zenodoToken,
  name: config.zenodoName,
  visualizationUrl: config.zenodoVisualizationUrl,
  attachments: config.zenodoAttachments
});

exports.createEntry = composeWithError(async (ctx) => {
  const { entryId } = ctx.query;
  if (!entryId) {
    decorateError(ctx, 400, 'missing entryId query parameter');
    return;
  }
  const { couch, userEmail } = ctx.state;
  debug(`create Zenodo entry: ${entryId} (${userEmail})`);
  const zenodoEntry = await couch.getEntryWithRights(
    entryId,
    userEmail,
    'write'
  );
  const { $content: { meta, entries, doi, readme: entryReadme } } = zenodoEntry;
  if (!entries || entries.length === 0) {
    decorateError(ctx, 400, 'cannot publish on Zenodo without entries');
    return;
  }
  if (typeof doi === 'string' && doi.length > 1) {
    decorateError(ctx, 403, 'this entry has already been published');
    return;
  }
  const readme = config.zenodoReadme || entryReadme;
  if (!readme) {
    decorateError(ctx, 400, 'readme is mandatory');
    return;
  }

  let depositionMeta;
  try {
    depositionMeta = await rocZenodo.getZenodoDeposition(meta);
  } catch (e) {
    decorateError(ctx, 400, e.message);
    return;
  }

  // We first get entries in case there is an error
  const entryValues = await Promise.all(
    entries.map((entry) => {
      if (entry.rev) {
        return couch.getEntryWithRights(entry.id, userEmail, 'read', {
          rev: entry.rev
        });
      } else {
        return couch.getEntryWithRights(entry.id, userEmail, 'read');
      }
    })
  );

  const deposition = await rocZenodo.createEntry(depositionMeta);
  const newDoi = deposition.metadata.prereserve_doi.doi;
  zenodoEntry.$content.doi = newDoi;
  zenodoEntry.$content.status.unshift({
    epoch: Date.now(),
    value: 'Publishing'
  });

  {
    const suffix = rocZenodo.getDescriptionSuffix(deposition);
    if (suffix !== '') {
      deposition.metadata.description += suffix;
      await rocZenodo.updateEntry(deposition);
    }
  }

  const result = await couch.insertEntry(zenodoEntry, userEmail);
  zenodoEntry._rev = result.info.rev;

  uploadAttachments(
    deposition,
    zenodoEntry,
    entryValues,
    readme,
    couch,
    userEmail
  ).catch((e) => {
    debug.error('failed to upload attachments to Zenodo', e.message);
  });

  ctx.status = 202;
  ctx.body = {
    ok: true,
    doi: newDoi
  };
});

async function uploadAttachments(
  deposition,
  zenodoEntry,
  entries,
  readme,
  couch,
  userEmail
) {
  const toc = [];

  let entryCount = 0;

  try {
    /* eslint-disable no-await-in-loop */
    for (const entry of entries) {
      const { _id: id, $content: content, $kind: kind } = entry;
      const entryZenodoId = String(entryCount).padStart(3, '0');
      const filenamePrefix = `${kind}_${entryZenodoId}`;
      await rocZenodo.uploadFile(deposition, {
        filename: `${filenamePrefix}/index.json`,
        contentType: 'application/octet-stream',
        data: JSON.stringify(content, null, 2)
      });
      if (rocZenodo.attachments) {
        let customAttachments = rocZenodo.attachments(content);
        if (!Array.isArray(customAttachments)) {
          if (
            typeof customAttachments === 'object' &&
            customAttachments !== null
          ) {
            customAttachments = [customAttachments];
          } else {
            throw new TypeError(
              'custom attachments method must return an array'
            );
          }
        }
        for (const customAttachment of customAttachments) {
          if (!customAttachment.filename || !customAttachment.data) {
            throw new TypeError(
              'custom attachments must have a filename and data property'
            );
          }
          await rocZenodo.uploadFile(deposition, {
            filename: `${filenamePrefix}/${customAttachment.filename}`,
            contentType:
              customAttachment.contentType || 'application/octet-stream',
            data: customAttachment.data
          });
        }
      }
      for (const attachmentPath in entry._attachments) {
        const contentType = entry._attachments[attachmentPath].content_type;
        const attachmentStream = await couch.getAttachmentByName(
          id,
          attachmentPath,
          userEmail,
          true
        );
        await rocZenodo.uploadFile(deposition, {
          filename: `${filenamePrefix}/${attachmentPath}`,
          contentType,
          data: attachmentStream
        });
      }
      toc.push({ kind: entry.$kind, id: entryZenodoId });
      entryCount++;
    }
    /* eslint-enable */

    await rocZenodo.uploadFile(deposition, {
      filename: '_toc.json',
      contentType: 'application/octet-stream',
      data: JSON.stringify(toc, null, 2)
    });
    await rocZenodo.uploadFile(deposition, rocZenodo.getIndexMd(readme));
    await rocZenodo.publishEntry(deposition);
  } catch (e) {
    await rocZenodo.deleteEntry(deposition);
    zenodoEntry.$content.doi = '';
    zenodoEntry.$content.status.unshift({
      epoch: Date.now(),
      value: 'Error'
    });
    await couch.insertEntry(zenodoEntry, userEmail);
    throw e;
  }

  zenodoEntry.$content.status.unshift({
    epoch: Date.now(),
    value: 'Published'
  });

  await couch.insertEntry(zenodoEntry, userEmail);
}