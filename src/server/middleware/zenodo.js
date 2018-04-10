'use strict';

const { RocZenodo } = require('roc-zenodo');

const config = require('../../config/config').globalConfig;

const { composeWithError } = require('./util');

let rocZenodo = new RocZenodo({
  zenodoHost: config.zenodoSandbox ? 'sandbox.zenodo.org' : 'zenodo.org',
  zenodoToken: config.zenodoToken,
  name: config.zenodoName
});

exports.createEntry = composeWithError(async (ctx) => {
  const zenodoEntry = await ctx.state.couch.getDocByRights(
    ctx.params.entryId,
    ctx.state.userEmail,
    'write',
    'entry'
  );
  ctx.body = zenodoEntry;
});
