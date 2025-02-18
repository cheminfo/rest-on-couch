'use strict';

const { setTimeout } = require('node:timers/promises');

const config = require('../../config/config').globalConfig;
const { RocZenodo } = require('../../roc-zenodo');
const debug = require('../../util/debug')('zenodo');

const { decorateError } = require('./decorateError');
const { composeWithError } = require('./util');

let rocZenodoProd = new RocZenodo({
  sandbox: false,
  token: config.zenodoToken,
  name: config.zenodoName,
  visualizationUrl: config.zenodoVisualizationUrl,
  attachments: config.zenodoAttachments,
});

let rocZenodoSandbox = config.zenodoSandboxToken
  ? new RocZenodo({
      sandbox: true,
      token: config.zenodoSandboxToken,
      name: config.zenodoName,
      visualizationUrl: config.zenodoVisualizationUrl,
      attachments: config.zenodoAttachments,
    })
  : null;

exports.createEntry = composeWithError(async (ctx) => {
  const { entryId } = ctx.query;
  if (!entryId) {
    decorateError(ctx, 400, 'missing entryId query parameter');
    return;
  }
  const { couch, userEmail } = ctx.state;
  debug('create Zenodo entry: %s (%s)', entryId, userEmail);
  const zenodoEntry = await couch.getEntryWithRights(
    entryId,
    userEmail,
    'write',
  );
  const {
    $content: { meta, entries, doi, parent, readme: entryReadme, sandbox },
  } = zenodoEntry;
  if (!entries || entries.length === 0) {
    debug('no entries in Zenodo entry');
    decorateError(ctx, 400, 'cannot publish on Zenodo without entries');
    return;
  }
  if (typeof doi === 'string' && doi.length > 1) {
    debug('Zenodo entry already has a doi');
    decorateError(ctx, 403, 'this entry has already been published');
    return;
  }
  const readme = config.zenodoReadme || entryReadme;
  if (!readme) {
    debug('missing readme in Zenodo entry');
    decorateError(ctx, 400, 'readme is mandatory');
    return;
  }
  let rocZenodo = sandbox ? rocZenodoSandbox : rocZenodoProd;
  if (rocZenodo === null) {
    decorateError(ctx, 500, 'sandbox is not setup on this server');
    return;
  }

  let depositionMeta;
  try {
    depositionMeta = await rocZenodo.getZenodoDeposition(meta);
  } catch (e) {
    debug('metadata is invalid');
    decorateError(ctx, 400, e.message);
    return;
  }

  // We first get entries in case there is an error
  const entryValues = await Promise.all(
    entries.map((entry) => {
      if (entry.rev) {
        return couch.getEntryWithRights(entry.id, userEmail, 'read', {
          rev: entry.rev,
        });
      } else {
        return couch.getEntryWithRights(entry.id, userEmail, 'read');
      }
    }),
  );
  entryValues.forEach((entryValue, i) => {
    entryValue.entry = entries[i];
  });

  let deposition;
  if (parent) {
    debug('create new version from parent');
    if (!parent.recid) {
      debug('parent is missing recid');
      decorateError(ctx, 400, 'parent must have a recid');
      return;
    }
    deposition = await rocZenodo.createNewVersion(parent.recid, depositionMeta);
  } else {
    debug('create Zenodo entry');
    deposition = await rocZenodo.createEntry(depositionMeta);
  }

  const newDoi = deposition.metadata.prereserve_doi.doi;
  const newRecid = deposition.metadata.prereserve_doi.recid;
  zenodoEntry.$content.doi = newDoi;
  zenodoEntry.$content.recid = newRecid;
  zenodoEntry.$content.status.unshift({
    epoch: Date.now(),
    value: 'Publishing',
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

  publish(
    deposition,
    zenodoEntry,
    entryValues,
    readme,
    couch,
    userEmail,
    rocZenodo,
  ).then(
    () => {
      debug('publication successful');
    },
    (e) => {
      debug.error('failed to publish entry to Zenodo', e.message);
    },
  );

  ctx.status = 202;
  ctx.body = {
    ok: true,
    doi: newDoi,
    recid: newRecid,
  };
});

async function publish(
  deposition,
  zenodoEntry,
  entries,
  readme,
  couch,
  userEmail,
  rocZenodo,
) {
  const toc = [];

  let entryCount = 0;

  try {
    for (const entry of entries) {
      const { _id: id, $content: content, $kind: kind, meta } = entry;

      const entryZenodoId = String(entryCount).padStart(3, '0');
      const filenamePrefix = `${kind}_${entryZenodoId}`;
      const tocEntry = { kind: entry.$kind, id: entryZenodoId };
      if (meta) {
        tocEntry.meta = meta;
      }
      toc.push(tocEntry);

      await rocZenodo.uploadFile(deposition, {
        filename: `${filenamePrefix}/index.json`,
        contentType: 'application/octet-stream',
        data: JSON.stringify(content, null, 2),
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
              'custom attachments method must return an array',
            );
          }
        }
        for (const customAttachment of customAttachments) {
          if (!customAttachment.filename || !customAttachment.data) {
            throw new TypeError(
              'custom attachments must have a filename and data property',
            );
          }
          await rocZenodo.uploadFile(deposition, {
            filename: `${filenamePrefix}/${customAttachment.filename}`,
            contentType:
              customAttachment.contentType || 'application/octet-stream',
            data: customAttachment.data,
          });
        }
      }
      for (const attachmentPath in entry._attachments) {
        const contentType = entry._attachments[attachmentPath].content_type;
        const attachmentStream = await couch.getAttachmentByName(
          id,
          attachmentPath,
          userEmail,
          true,
        );
        await setTimeout(600);
        await rocZenodo.uploadFile(deposition, {
          filename: `${filenamePrefix}/${attachmentPath}`,
          contentType,
          data: attachmentStream,
        });
      }
      entryCount++;
    }

    await rocZenodo.uploadFile(deposition, {
      filename: '_toc.json',
      contentType: 'application/octet-stream',
      data: JSON.stringify(toc, null, 2),
    });
    await rocZenodo.uploadFile(deposition, rocZenodo.getIndexMd(readme));
    await rocZenodo.publishEntry(deposition);
  } catch (e) {
    try {
      await rocZenodo.deleteEntry(deposition);
    } catch {
      // ignore
    }
    zenodoEntry.$content.doi = '';
    zenodoEntry.$content.recid = null;
    const status = {
      epoch: Date.now(),
      value: 'Error',
    };
    if (e && e.response && e.response.data) {
      status.error = e.response.data;
    }
    zenodoEntry.$content.status.unshift(status);
    await couch.insertEntry(zenodoEntry, userEmail);
    throw e;
  }

  zenodoEntry.$content.status.unshift({
    epoch: Date.now(),
    value: 'Published',
  });

  await couch.insertEntry(zenodoEntry, userEmail);
}
