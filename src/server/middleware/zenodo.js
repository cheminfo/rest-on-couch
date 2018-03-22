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
  console.log(ctx.query);
  console.log(ctx.body);
  ctx.body = { todo: 'yep' };
});
