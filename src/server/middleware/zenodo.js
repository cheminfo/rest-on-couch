'use strict';

const { RocZenodo } = require('roc-zenodo');

const config = require('../../config/config').globalConfig;

const decorateError = require('./decorateError');
const { composeWithError } = require('./util');

let rocZenodo = new RocZenodo({
  zenodoHost: config.zenodoSandbox ? 'sandbox.zenodo.org' : 'zenodo.org',
  zenodoToken: config.zenodoToken,
  name: config.zenodoName
});

exports.createEntry = composeWithError(async (ctx) => {
  const { entryId } = ctx.query;
  if (!entryId) {
    decorateError(ctx, 400, 'missing entryId query parameter');
    return;
  }
  const zenodoEntry = await ctx.state.couch.getDocByRights(
    ctx.query.entryId,
    ctx.state.userEmail,
    'write',
    'entry'
  );
  const { $content: { meta, samples } } = zenodoEntry;
  const deposition = await rocZenodo.createEntry(meta);
  ctx.body = zenodoEntry;
});
