'use strict';

module.exports = async function noReferenceImport(ctx, result) {
  result.kind = 'sample';
  result.id = 'noReference';
  result.owner = 'a@a.com';
  result.jpath = ['main', 'jpath'];
  result.field = 'field';
  result.metadata = {
    noRefMetadata: true,
  };
};
