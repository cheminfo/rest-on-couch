'use strict';

const fs = require('fs-extra');

module.exports = async function tryMove(from, to, suffix = 0) {
  if (suffix > 1000) {
    throw new Error('tryMove: too many retries');
  }
  let newTo = to;
  if (suffix > 0) {
    newTo += `.${suffix}`;
  }
  try {
    await fs.move(from, newTo);
  } catch (error) {
    if (error.code !== 'EEXIST' && error.message !== 'dest already exists.') {
      throw new Error(`Could not rename ${from} to ${newTo}`, {
        cause: error,
      });
    }
    await tryMove(from, to, ++suffix);
  }
};
